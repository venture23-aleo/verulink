package relay

import (
	"context"
	"errors"
	"fmt"

	"github.com/venture23-aleo/attestor/chainService/chain"
	common "github.com/venture23-aleo/attestor/chainService/common"
	"github.com/venture23-aleo/attestor/chainService/config"
	"github.com/venture23-aleo/attestor/chainService/logger"
	"github.com/venture23-aleo/attestor/chainService/store"
	"go.uber.org/zap"
)

const (
	walletScreeningNameSpace = "walletScreeningNS"
)

var (
	chainIDToChainName         = map[uint32]string{}
	RegisteredClients          = map[string]ClientFunc{}
	RegisteredHashers          = map[string]HashFunc{}
	RegisteredRetryChannels    = map[string]chan *chain.Packet{}
	RegisteredCompleteChannels = map[string]chan<- *chain.Packet{}
)

type ClientFunc func(cfg *config.ChainConfig, m map[string]uint32) chain.IClient
type HashFunc func(sp *chain.ScreenedPacket) string

func StartRelay(ctx context.Context, cfg *config.Config) {
	err := store.CreateNamespaces([]string{walletScreeningNameSpace})
	if err != nil {
		panic(err)
	}

	pktCh := make(chan *chain.Packet)
	go initPacketFeeder(ctx, cfg.ChainConfigs, pktCh)
	go receivePktsFromCollector(ctx, pktCh)
	consumePackets(ctx, pktCh)
}

func initPacketFeeder(ctx context.Context, cfgs []*config.ChainConfig, pktCh chan<- *chain.Packet) {
	ch := make(chan chain.IClient, len(cfgs))

	m := make(map[string]uint32)
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

func consumePackets(ctx context.Context, pktCh <-chan *chain.Packet) {
	guideCh := make(chan struct{}, config.GetConfig().ConsumePacketWorker)
	for {
		select {
		case <-ctx.Done():
			return
		case guideCh <- struct{}{}:
		}

		pkt := <-pktCh
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
	sp := &chain.ScreenedPacket{
		Packet:  pkt,
		IsWhite: isWhite,
	}

	signature, err := signScreenedPacket(sp)
	if err != nil {
		logger.GetLogger().Error(
			"Error while signing packet", zap.Error(err), zap.Any("packet", pkt))
		return
	}

	err = sendToCollector(sp, signature)
	if err != nil {
		if errors.Is(err, common.AlreadyRelayedPacket{}) {
			err = nil // non-nil error will put packet in retry namespace
			return
		}
		logger.GetLogger().Error("Error while putting signature", zap.Error(err))
		return
	}
}
