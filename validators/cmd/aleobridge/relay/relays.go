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
	Name() string
}

type ClientFunc func(cfg *ChainConfig) IClient

var (
	RegisteredClients = map[string]ClientFunc{}
)

type Relays struct {
	relays []Relayer
}

func MultiRelay(ctx context.Context, cfg *Config) *Relays {
	chains := map[string]IClient{}
	for _, chainCfg := range cfg.ChainConfigs {
		if _, ok := RegisteredClients[chainCfg.Name]; !ok {
			panic(fmt.Sprintf("trying to initialize unregistered chain %s", chainCfg.Name))
		}

		chains[chainCfg.Name] = RegisteredClients[chainCfg.Name](chainCfg)
	}

	/*
		For each dst in chain config, we need to make one relay which raises two goroutines to
		communicate packets separately.


	*/

	relays := &Relays{}
	for chain1, chain2 := range cfg.BridgePairs {
		relay := relay{
			Chain1: chains[chain1],
			Chain2: chains[chain2],
		}

		relays.relays = append(relays.relays, &relay)
	}

	return relays
}

func (r *Relays) StartMultiRelay(ctx context.Context) {
	relayCh := make(chan Relayer, len(r.relays))

	for _, relay := range r.relays {
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

				re.Init(relayCtx)
				defer func() {
					if r := recover(); r != nil {
						relayCtxCncl(Panic)
						// add wait condition to complete panic handeling
						relayCh <- re
					}
				}()
				fmt.Printf("Started %s\n", re.Name())
				re.Start(relayCtx)
			}(re)
		}
	}
}
