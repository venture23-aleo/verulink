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

type IClient interface {
	chain.IReceiver
	chain.ISender
	GetDestChains() ([]string, error)
	Name() string
}

type ClientFunc func(cfg *ChainConfig) IClient

var (
	RegisteredClients = map[string]ClientFunc{}
)

type Relays []Relayer

func MultiRelay(ctx context.Context, cfg *Config) Relays {
	chains := map[string]IClient{}
	for _, chainCfg := range cfg.ChainConfigs {
		if _, ok := RegisteredClients[chainCfg.Name]; !ok {
			panic(fmt.Sprintf("trying to initialize unregistered chain %s", chainCfg.Name))
		}

		chains[chainCfg.Name] = RegisteredClients[chainCfg.Name](chainCfg)
	}

	var relays Relays
	for _, chain := range chains {
		destChains, err := chain.GetDestChains()
		if err != nil {
			// todo: handle error and if it persists panic
		}

		for _, destChain := range destChains {
			r := NewRelay(chain, chains[destChain], nil, nil)
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
