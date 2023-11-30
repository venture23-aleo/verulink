package relay

import (
	"context"
	"fmt"
	"time"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

const (
	DefaultSendMessageTicker = 10 * time.Second
	DefaultTxRetryCount      = 0
)

type IChainEvent interface {
	GetChainEvent(ctx context.Context) (*chain.ChainEvent, error)
}
type IClient interface {
	chain.IReceiver
	chain.ISender
	IChainEvent
	GetDestChains() ([]string, error)
	Name() string
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
	}

	var relays Relays
	for _, c := range chains {
		destChains, err := c.GetDestChains()
		if err != nil {
			// todo: handle error and if it persists panic
		}

		for _, destChain := range destChains {

			ch := make(chan *chain.ChainEvent)
			EventChanMap[c.Name()] = append(EventChanMap[c.Name()], ch)

			r := NewRelay(c, chains[destChain], ch)
			relays = append(relays, r)
		}

		go GetChainEvents(ctx, c, EventChanMap[c.Name()])
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

func GetChainEvents(ctx context.Context, chain IChainEvent, eventChannels []chan<- *chain.ChainEvent) {
	// todo: initialize some ticker to poll the chain at regular interval
	for {
		select {
		case <-ctx.Done():
			//
			//case <-ticker.C:
		}

		event, err := chain.GetChainEvent(ctx)
		if err != nil {
			// log error
			continue
		}

		if event == nil {
			continue
		}

		for _, ch := range eventChannels {
			/*
			   todo: What happens when goroutine that would consume event has terminated? or channel is closed by other goroutine?
			*/
			ch <- event
		}
	}
}
