package relay

import (
	"context"
	"fmt"
	"math/big"

	"github.com/venture23-aleo/attestor/chainService/chain"
	"github.com/venture23-aleo/attestor/chainService/config"
	"github.com/venture23-aleo/attestor/chainService/logger"
	"github.com/venture23-aleo/attestor/chainService/store"
	"go.uber.org/zap"
)

const (
	walletScreeningNameSpace = "walletScreeningNS"
)

var (
	chainIDToChainName         = map[*big.Int]string{}
	RegisteredClients          = map[string]ClientFunc{}
	RegisteredHashers          = map[string]HashFunc{}
	RegisteredRetryChannels    = map[string]chan *chain.Packet{}
	RegisteredCompleteChannels = map[string]chan<- *chain.Packet{}
)

type ClientFunc func(cfg *config.ChainConfig) chain.IClient
type HashFunc func(sp *chain.ScreenedPacket) string

func StartRelay(ctx context.Context, cfg *config.Config) {
	err := store.CreateNamespaces([]string{walletScreeningNameSpace})
	if err != nil {
		panic(err)
	}

	pktCh := make(chan *chain.Packet)
	doneCh := make(chan struct{})
	go initPacketFeeder(ctx, cfg.ChainConfigs, pktCh, doneCh)
	<-doneCh
	consumePackets(ctx, pktCh)
}

func initPacketFeeder(ctx context.Context, cfgs []*config.ChainConfig, pktCh chan<- *chain.Packet, doneCh chan struct{}) {
	ch := make(chan chain.IClient, len(cfgs))
	go func() {
		for _, chainCfg := range cfgs {
			if _, ok := RegisteredClients[chainCfg.Name]; !ok {
				panic(fmt.Sprintf("module undefined for chain %s", chainCfg.Name))
			}

			if _, ok := RegisteredHashers[chainCfg.Name]; !ok {
				panic(fmt.Sprintf("hash undefined for chain %s", chainCfg.Name))
			}
			ch <- RegisteredClients[chainCfg.Name](chainCfg)
			chainIDToChainName[chainCfg.ChainID] = chainCfg.Name
		}
		close(doneCh)
	}()

	<-doneCh

	for chain := range ch {
		chain := chain
		go func() {
			ctx, cncl := context.WithCancel(ctx)
			defer func() {
				if r := recover(); r != nil {
					cncl()
					ch <- chain
				}
			}()
			defer cncl()
			chain.FeedPacket(ctx, pktCh)
		}()
	}
}

func consumePackets(ctx context.Context, pktCh <-chan *chain.Packet) {
	guideCh := make(chan struct{}, config.GetConfig().ConsumePacketWorker)
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}
		pkt := <-pktCh
		guideCh <- struct{}{}

		go func() {
			defer func() {
				<-guideCh
			}()

			processPacket(pkt)
		}()
	}
}

func processPacket(pkt *chain.Packet) {
	chainName := chainIDToChainName[pkt.Source.ChainID]
	var (
		err     error
		isWhite bool
	)

	defer func() {
		if err != nil {
			RegisteredRetryChannels[chainName] <- pkt
			err := storeWhiteStatus(pkt, isWhite)
			if err != nil {
				logger.GetLogger().Error("Error while storing white status", zap.Error(err))
			}
			return
		}
		RegisteredCompleteChannels[chainName] <- pkt
	}()

	isWhite = screen(pkt) // todo: might need to receive error as well
	sp := chain.ScreenedPacket{
		Packet:  pkt,
		IsWhite: isWhite,
	}

	signature, err := signScreenedPacket(&sp)
	if err != nil {
		logger.GetLogger().Error(
			"Error while signing packet", zap.Error(err), zap.Any("packet", pkt))
		return
	}

	err = sendToCollector(&sp, signature)
	if err != nil {
		logger.GetLogger().Error("Error while putting signature", zap.Error(err))
		return
	}

	RegisteredCompleteChannels[chainName] <- pkt
}
