package relay

import (
	"context"
	"fmt"
	"sync"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

var chainCtxMu = sync.Mutex{}
var chainCtxCncls = map[string]context.CancelCauseFunc{}
var relayCh = make(chan Relayer)

type Namer interface {
	Name() string
}

type IChainEvent interface {
	Namer
	GetChainEvent(ctx context.Context) (*chain.ChainEvent, error)
}

type IClient interface {
	chain.IReceiver
	chain.ISender
	IChainEvent
	Namer
	GetDestChains() ([]string, error)
}

type ClientFunc func(cfg *ChainConfig) IClient

var (
	RegisteredClients = map[string]ClientFunc{}
	EventChanMap      = map[string][]chan<- *chain.ChainEvent{}
)

type Relays []Relayer

// what if gas depletion?
func MultiRelay(ctx context.Context, cfg *Config) Relays {
	chains := map[string]IClient{}

	for _, chainCfg := range cfg.ChainConfigs {
		if _, ok := RegisteredClients[chainCfg.Name]; !ok {
			panic(fmt.Sprintf("module undefined for chain %s", chainCfg.Name))
		}

		chains[chainCfg.Name] = RegisteredClients[chainCfg.Name](chainCfg)
	}

	var relays Relays
	for _, c := range chains {
		destChains, err := c.GetDestChains()
		if err != nil {
			destChains, err = c.GetDestChains()
			if err != nil {
				panic(err)
			}
		}

		for _, destChain := range destChains {
			srcIClient := c
			descIClient := chains[destChain]
			r := NewRelay(srcIClient, descIClient)
			relays = append(relays, r)
		}
	}

	return relays
}

func (relays Relays) StartMultiRelay(ctx context.Context) {
	go func() {
		for _, re := range relays {
			relayCh <- re
		}
	}()

	for re := range relayCh {
		go func(relay Relayer) {
			relayCtx, relayCtxCncl := context.WithCancelCause(ctx)
			defer relayCtxCncl(nil)

			chainCtxMu.Lock()
			chainCtxCncls[relay.Name()] = relayCtxCncl
			chainCtxMu.Unlock()

			relay.Init(relayCtx)
		}(re)
	}

	<-ctx.Done()
}
