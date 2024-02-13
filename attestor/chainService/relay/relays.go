package relay

import (
	"context"
	"errors"
	"fmt"
	"math/big"

	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
	common "github.com/venture23-aleo/aleo-bridge/attestor/chainService/common"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/config"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/logger"
	addressscreener "github.com/venture23-aleo/aleo-bridge/attestor/chainService/relay/address_screener"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/relay/collector"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/relay/signer"
	"go.uber.org/zap"
)

var (
	RegisteredClients          = map[string]chain.ClientFunc{}
	RegisteredRetryChannels    = map[string]chan *chain.Packet{}
	RegisteredCompleteChannels = map[string]chan<- *chain.Packet{}
)

var (
	chainIDToChain = map[string]chain.IClient{}
)

type relay struct {
	collector collector.CollectorI
	signer    signer.SignI
	screener  addressscreener.ScreenI
}

func StartRelay(ctx context.Context, cfg *config.Config) {
	err := signer.SetupSigner(&cfg.SigningServiceConfig)
	if err != nil {
		panic(err)
	}

	err = addressscreener.SetupScreenService()
	if err != nil {
		panic(err)
	}

	chainIdToAddress := make(map[string]string)
	for _, v := range cfg.ChainConfigs {
		chainIdToAddress[v.ChainID.String()] = v.WalletAddress
	}

	err = collector.SetupCollector(
		cfg.CollectorServiceConfig.Uri,
		chainIdToAddress,
		cfg.CollectorServiceConfig.CollectorWaitDur,
	)
	if err != nil {
		panic(err)
	}

	r := relay{
		collector: collector.GetCollector(),
		signer:    signer.GetSigner(),
		screener:  addressscreener.GetScreener(),
	}
	pktCh := make(chan *chain.Packet)
	go func() {
		<-ctx.Done()
		close(pktCh) // todo: verify graceful killing
	}()

	missedPktCh := make(chan *chain.MissedPacket)
	refetchCh := make(chan struct{})

	go r.initPacketFeeder(ctx, cfg.ChainConfigs, pktCh)
	go r.collector.ReceivePktsFromCollector(ctx, missedPktCh, refetchCh)
	go r.consumeMissedPackets(ctx, missedPktCh, pktCh, refetchCh)
	r.consumePackets(ctx, pktCh)
}

func (relay) initPacketFeeder(ctx context.Context, cfgs []*config.ChainConfig, pktCh chan<- *chain.Packet) {
	ch := make(chan chain.IClient, len(cfgs))

	m := make(map[string]*big.Int)
	for _, chainCfg := range cfgs {
		m[chainCfg.Name] = chainCfg.ChainID
	}

	for _, chainCfg := range cfgs {
		if _, ok := RegisteredClients[chainCfg.Name]; !ok {
			panic(fmt.Sprintf("module undefined for chain %s", chainCfg.Name))
		}

		chain := RegisteredClients[chainCfg.Name](chainCfg, m)
		chainIDToChain[chainCfg.ChainID.String()] = chain
		ch <- chain
	}

	for chain := range ch {
		chain := chain
		go func() {
			ctx, cncl := context.WithCancel(ctx)
			defer cncl()
			defer func() {
				if r := recover(); r != nil {
					cncl()
					ch <- chain
				}
			}()
			chain.FeedPacket(ctx, pktCh)
		}()
	}
}

func (r *relay) consumePackets(ctx context.Context, pktCh <-chan *chain.Packet) {
	guideCh := make(chan struct{}, config.GetConfig().ConsumePacketWorker)
	for {
		select {
		case <-ctx.Done():
			return
		case guideCh <- struct{}{}:
		}

		pkt, ok := <-pktCh
		if !ok {
			return
		}
		go func() {
			defer func() {
				<-guideCh
			}()
			r.processPacket(ctx, pkt)
		}()
	}
}

func (r *relay) processPacket(ctx context.Context, pkt *chain.Packet) {
	srcChainName := chainIDToChain[pkt.Source.ChainID.String()].Name()
	var (
		err     error
		isWhite bool
	)

	defer func() {
		if pkt.IsMissed() { // Skip post processing for packets delivered from collector(db-service)
			return
		}
		if err != nil {
			RegisteredRetryChannels[srcChainName] <- pkt
			err := r.screener.StoreWhiteStatus(pkt, isWhite)
			if err != nil {
				logger.GetLogger().Error("Error while storing white status", zap.Error(err))
			}
			return
		}
		RegisteredCompleteChannels[srcChainName] <- pkt
	}()

	isWhite = r.screener.Screen(pkt) // todo: might need to receive error as well
	sp := &chain.ScreenedPacket{
		Packet:  pkt,
		IsWhite: isWhite,
	}
	hash, signature, err := r.signer.HashAndSignScreenedPacket(ctx, sp)
	if err != nil {
		logger.GetLogger().Error(
			"Error while signing packet", zap.Error(err), zap.Any("packet", pkt))
		return
	}

	logger.GetLogger().Info("packet hashed and signed",
		zap.String("hash", hash), zap.String("signature", signature))

	err = r.collector.SendToCollector(ctx, sp, hash, signature)
	if err != nil {
		if errors.Is(err, common.AlreadyRelayedPacket{}) {
			err = nil // non-nil error will put packet in retry namespace
			return
		}
		logger.GetLogger().Error("Error while putting signature", zap.Error(err))
		return
	}

	logger.GetLogger().Info("Yay packet successfully sent")
}

func (r *relay) consumeMissedPackets(
	ctx context.Context, missedPktCh <-chan *chain.MissedPacket,
	pktCh chan<- *chain.Packet, refetchCh chan<- struct{}) { // refetchCh Channel to signal collector

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		missedPkt := <-missedPktCh
		srcChain := chainIDToChain[missedPkt.SourceChainID.String()]
		destChain := chainIDToChain[missedPkt.TargetChainID.String()] // check if the packet has already been consumed in the destination
		consumed := destChain.IsConsumed(ctx, missedPkt.SourceChainID, missedPkt.SeqNum)
		if consumed {
			continue // if packet is already consumed in destination then ignore the packet
		}
		pkt, err := srcChain.GetMissedPacket(ctx, missedPkt)
		if err != nil {
			logger.GetLogger().Error("Error while getting missed packet",
				zap.Any("missed_packet", missedPkt), zap.Error(err))
			continue
		}
		pkt.SetMissed(true)
		r.processPacket(ctx, pkt)

		if missedPkt.IsLast {
			refetchCh <- struct{}{}
		}
	}
}
