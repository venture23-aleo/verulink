package relay

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

const (
	DefaultSendMessageTicker = 10 * time.Second
	DefaultTxRetryCount      = 0
)

var chainEventRWMu = sync.RWMutex{}
var chainEvents = map[string]*chain.ChainEvent{}
var chainConds = map[string]*sync.Cond{}
var chainCtxCncls = map[string]context.CancelCauseFunc{}
var chainCtxs = map[string]context.Context{}

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

func MultiRelay(ctx context.Context, cfg *Config) Relays {
	chains := map[string]IClient{}

	for _, chainCfg := range cfg.ChainConfigs {
		if _, ok := RegisteredClients[chainCfg.Name]; !ok {
			panic(fmt.Sprintf("module undefined for chain %s", chainCfg.Name))
		}

		chains[chainCfg.Name] = RegisteredClients[chainCfg.Name](chainCfg)
		chainCtx, chainCtxCnclCause := context.WithCancelCause(ctx)
		cond := &sync.Cond{
			L: &sync.Mutex{},
		}

		chainConds[chainCfg.Name] = cond
		chainCtxs[chainCfg.Name] = chainCtx
		chainCtxCncls[chainCfg.Name] = chainCtxCnclCause

		go GetChainEvents(chainCtx, chains[chainCfg.Name], cond)
		go CancelCtxOnCnclEvent(chainCfg.Name, cond)

	}

	var relays Relays
	for _, c := range chains {
		destChains, err := c.GetDestChains()
		if err != nil {
			// todo: handle error and if it persists panic
		}

		for _, destChain := range destChains {
			srcIClient := c
			descIClient := chains[destChain]
			srcCond := chainConds[c.Name()]
			destCond := chainConds[destChain]
			r := NewRelay(srcIClient, descIClient, srcCond, destCond)
			relays = append(relays, r)
		}
	}

	return relays
}

func (r Relays) StartMultiRelay(ctx context.Context) {
	relayCh := make(chan Relayer, len(r))

	for _, relay := range r {
		relayCh <- relay
	}

	// handle panicking case
	for {
		select {
		case <-ctx.Done():
			fmt.Println("context cancelled")
			return
		case re := <-relayCh:
			go func(relay Relayer) {
				relayCtx, relayCtxCncl := context.WithCancelCause(ctx)
				defer relayCtxCncl(nil)
				defer func() {
					if r := recover(); r != nil {
						relayCtxCncl(Panic)
						// add wait condition to complete panic handeling
						relayCh <- re
					}
				}()
				re.Init(relayCtx)
			}(re)
		}
	}
}

// GetChainEvents will receive events of given chain and will insert into subscribing channels.
// todo: need to take care that given channel might get closed or inserted value might not be consumed.

/*

relay1 --> ethereum - aleo --> eventChannels[ethCh]
relay2 --> ethereum - solana --> eventChannels[ethCh]

go GetChainEvents(ctx, ethereumChain, eventChannels)


relay3 --> aleo - ethereum --> eventChannels[aleoCh]
relay4 --> aleo - solana --> eventChannels[aleoCh]

go GetChainEvents(ctx, aleoChain, eventChannels)

*/

func GetChainEvents(ctx context.Context, chain IChainEvent, cond *sync.Cond) {
	// todo: initialize some ticker to poll the chain at regular interval
	// It should also match the frequency of chain events.
	ticker := time.NewTicker(time.Hour)

	for {
		select {
		case <-ctx.Done():
		//
		case <-ticker.C:
		}

		event, err := chain.GetChainEvent(ctx)
		if err != nil {
			// log error
			continue
		}

		if event == nil {
			continue
		}

		chainEventRWMu.Lock()
		chainEvents[chain.Name()] = event
		chainEventRWMu.Unlock()

		cond.L.Lock()
		cond.Broadcast()
		cond.L.Unlock()

	}
}

func CancelCtxOnCnclEvent(name string, cond *sync.Cond) {
	var breakFor bool
	for {

		func() {
			cond.L.Lock()
			cond.Wait()

			chainEventRWMu.RLock()
			event := chainEvents[name]

			_ = event
			// todo: manage event
			/*
				for example;
				if event.Type == Cancel{
					chainCtxCncls[name](errors.New("chain is cancelled"))
				}
				breakFor = true
			*/

			defer chainEventRWMu.RUnlock()
			cond.L.Unlock()
		}()

		if breakFor {
			break
		}
	}
}
