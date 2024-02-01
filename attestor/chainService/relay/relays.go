package relay

import (
	"context"
	"errors"
	"fmt"
	"math/big"

	"github.com/venture23-aleo/attestor/chainService/chain"
	common "github.com/venture23-aleo/attestor/chainService/common"
	"github.com/venture23-aleo/attestor/chainService/config"
	"github.com/venture23-aleo/attestor/chainService/logger"
	addressscreener "github.com/venture23-aleo/attestor/chainService/relay/address_screener"
	"github.com/venture23-aleo/attestor/chainService/relay/collector"
	"github.com/venture23-aleo/attestor/chainService/relay/signer"
	"github.com/venture23-aleo/attestor/chainService/store"
	"go.uber.org/zap"
)

const (
	walletScreeningNameSpace = "walletScreeningNS"
)

var (
	RegisteredClients          = map[string]chain.ClientFunc{}
	RegisteredHashers          = map[string]chain.HashFunc{}
	RegisteredRetryChannels    = map[string]chan *chain.Packet{}
	RegisteredCompleteChannels = map[string]chan<- *chain.Packet{}
)

var (
	chainIDToChain = map[*big.Int]chain.IClient{}
)

type relay struct {
	collector collector.CollectorI
	signer    signer.SignI
	screener  addressscreener.ScreenI
}

func StartRelay(ctx context.Context, cfg *config.Config) {
	err := store.CreateNamespaces([]string{walletScreeningNameSpace})
	if err != nil {
		panic(err)
	}

	pktCh := make(chan *chain.Packet)
	go func() {
		<-ctx.Done()
		close(pktCh)
	}()

	r := relay{
		collector: collector.GetCollector(),
		signer:    signer.GetSigner(),
		screener:  addressscreener.GetScreener(),
	}

	missedPktCh := make(chan *chain.MissedPacket)
	go r.initPacketFeeder(ctx, cfg.ChainConfigs, pktCh)
	go r.collector.ReceivePktsFromCollector(ctx, missedPktCh)
	go r.processMissedPacket(ctx, missedPktCh, pktCh)
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

		if _, ok := RegisteredHashers[chainCfg.Name]; !ok {
			panic(fmt.Sprintf("hash undefined for chain %s", chainCfg.Name))
		}
		chain := RegisteredClients[chainCfg.Name](chainCfg, m)
		chainIDToChain[chainCfg.ChainID] = chain
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
			r.processPacket(pkt)
		}()
	}
}

func (r *relay) processPacket(pkt *chain.Packet) {
	srcChainName := chainIDToChain[pkt.Source.ChainID].Name()
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
	destChainName := chainIDToChain[pkt.Destination.ChainID].Name()
	signature, err := r.signer.SignScreenedPacket(sp, RegisteredHashers[destChainName])
	if err != nil {
		logger.GetLogger().Error(
			"Error while signing packet", zap.Error(err), zap.Any("packet", pkt))
		return
	}

	err = r.collector.SendToCollector(sp, signature)
	if err != nil {
		if errors.Is(err, common.AlreadyRelayedPacket{}) {
			err = nil // non-nil error will put packet in retry namespace
			return
		}
		logger.GetLogger().Error("Error while putting signature", zap.Error(err))
		return
	}
}

func (relay) processMissedPacket(ctx context.Context,
	missedPktCh <-chan *chain.MissedPacket, pktCh chan<- *chain.Packet) {

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		missedPkt := <-missedPktCh
		srcChain := chainIDToChain[missedPkt.SourceChainID]
		pkt, err := srcChain.GetMissedPacket(ctx, missedPkt)
		if err != nil {
			logger.GetLogger().Error("Error while getting missed packet",
				zap.Any("missed_packet", missedPkt), zap.Error(err))
			continue
		}
		pkt.SetMissed(true)
		pktCh <- pkt
	}
}
