package relay

import (
	"context"
	"fmt"
	"sync"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/config"
)

var (
	chainCtxMu        = sync.Mutex{}
	chainCtxCncls     = map[string]context.CancelCauseFunc{}
	relayCh           = make(chan Relayer)
	chains            = map[string]IClient{}
	RegisteredClients = map[string]ClientFunc{}
)

type Namer interface {
	Name() string
}

type IClient interface {
	chain.IReceiver
	chain.ISender
	Namer
}

type ClientFunc func(cfg *config.ChainConfig) IClient

type Relays []Relayer

func MultiRelay(ctx context.Context, cfg *config.Config) Relays {
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
			if _, ok := cfg.BridgePairMap[c.Name()][destChain]; !ok {
				continue
			}
			if _, ok := chains[destChain]; !ok {
				panic(fmt.Errorf("chain %s is not registered", destChain))
			}
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
}
