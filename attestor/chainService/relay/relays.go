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
	chainIDToChainName         = map[*big.Int]string{}
	RegisteredClients          = map[string]chain.ClientFunc{}
	RegisteredHashers          = map[string]chain.HashFunc{}
	RegisteredRetryChannels    = map[string]chan *chain.Packet{}
	RegisteredCompleteChannels = map[string]chan<- *chain.Packet{}
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

	go r.initPacketFeeder(ctx, cfg.ChainConfigs, pktCh)
	go r.collector.ReceivePktsFromCollector(ctx, pktCh)
	r.consumePackets(ctx, pktCh)
}

func (relay) initPacketFeeder(ctx context.Context, cfgs []*config.ChainConfig, pktCh chan<- *chain.Packet) {
	ch := make(chan chain.IClient, len(cfgs))

	m := make(map[string]*big.Int)
	for _, chainCfg := range cfgs {
		m[chainCfg.Name] = chainCfg.ChainID
		chainIDToChainName[chainCfg.ChainID] = chainCfg.Name
	}

	for _, chainCfg := range cfgs {
		if _, ok := RegisteredClients[chainCfg.Name]; !ok {
			panic(fmt.Sprintf("module undefined for chain %s", chainCfg.Name))
		}

		if _, ok := RegisteredHashers[chainCfg.Name]; !ok {
			panic(fmt.Sprintf("hash undefined for chain %s", chainCfg.Name))
		}
		ch <- RegisteredClients[chainCfg.Name](chainCfg, m)
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
	srcChainName := chainIDToChainName[pkt.Source.ChainID]
	var (
		err     error
		isWhite bool
	)

	defer func() {
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
	destChainName := chainIDToChainName[pkt.Destination.ChainID]
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
