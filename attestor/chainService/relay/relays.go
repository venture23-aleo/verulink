package relay

import (
	"context"
	"fmt"
	"sync"

	"github.com/venture23-aleo/attestor/chainService/chain"
	"github.com/venture23-aleo/attestor/chainService/config"
	"github.com/venture23-aleo/attestor/chainService/store"
)

const (
	packetNameSpace          = "packetsNS"
	walletScreeningNameSpace = "walletScreeningNS"
)

var RegisteredClients = map[string]ClientFunc{}
var RegisteredHashers = map[string]HashFunc{}

type Namer interface {
	Name() string
}

type ClientFunc func(cfg *config.ChainConfig) chain.IClient
type HashFunc func(sp *chain.ScreenedPacket) string

func StartRelay(ctx context.Context, cfg *config.Config) {
	err := store.CreateNamespaces(nil)
	if err != nil {
		panic(err)
	}

	dbCh := make(chan *chain.Packet)
	go store.StartStoringPackets(ctx, dbCh)
	doneCh := make(chan struct{})
	go initPacketFeeder(ctx, cfg.ChainConfigs, dbCh, doneCh)
	<-doneCh
	consumePackets(ctx)
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

type screenedPacket struct {
	*chain.Packet
	IsWhite bool
}

func consumePackets(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		ch := store.RetrieveNPackets("", 100)
		wg := sync.WaitGroup{}
		mu := sync.Mutex{}
		screenedPackets := make([]*screenedPacket, 0)
		for pkt := range ch {
			wg.Add(1)
			go func() {
				defer wg.Wait()

				isWhite := screen(pkt)

				mu.Lock()
				screenedPackets = append(screenedPackets, &screenedPacket{pkt, isWhite})
				mu.Unlock()
			}()
		}
		wg.Wait()

		// Get hash data respective to chain
		// Maybe get hash as well, as per chain
		// send message for signing
		// send signature to public-database. Store signature in database
		// on successful response, delete entry in database

	}
}
