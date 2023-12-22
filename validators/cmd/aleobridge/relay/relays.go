package relay

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

var chainCtxMu = sync.Mutex{}
var chainCtxCncls = map[string]context.CancelCauseFunc{}
var relayCh = make(chan Relayer)
var chains = map[string]IClient{}

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

/******************************************rpc call handler*************************************/
// stop action will cancel the context of all relays where given chain is part of
// and removes chain registration from the map
// Register action shall register chain into the map
func chainHandler(name string, action ActionType) error {
	chainCtxMu.Lock()
	defer chainCtxMu.Unlock()

	switch action {
	case Stop:
		for key, cncl := range chainCtxCncls {
			if strings.Contains(key, name) {
				cncl(errors.New("Cancelled by owner"))
				delete(chainCtxCncls, name)
				// delete(chains, name) only allow delete after Registration is provided
			}
		}
	case Register:
		// todo: Shall allow owner to pass chain params through rpc call

	}

	return nil
}

func relaysHandler(relays []RelayArg, action ActionType) error {
	for _, re := range relays {
		if _, ok := chains[re.SrcChain]; !ok {
			return fmt.Errorf("chain %s is not yet registered", re.SrcChain)
		}
		if _, ok := chains[re.DestChain]; !ok {
			return fmt.Errorf("chain %s is not yet registered", re.DestChain)
		}
	}

	chainCtxMu.Lock()
	defer chainCtxMu.Unlock()

	switch action {
	case Stop:
		for _, re := range relays {
			name := relayName(re.SrcChain, re.DestChain)
			chainCtxCncls[name](errors.New("cancelled by owner"))
			delete(chainCtxCncls, name)
		}
	case Register:
		for _, re := range relays {
			srcChain, destchain := chains[re.SrcChain], chains[re.DestChain]
			relay := NewRelay(srcChain, destchain)
			relayCh <- relay
		}
	}
	return nil
}
