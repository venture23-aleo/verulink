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

type Relay interface {
	Start(ctx context.Context)
	Init(ctx context.Context)
}

type relay struct {
	Chain1 IClient
	Chain2 IClient

	/*
		other fields if required
	*/
}

type Relays struct {
	relay []*relay
}

func NewRelay(chain1, chain2 IClient) Relay {
	return &relay{
		Chain1: chain1,
		Chain2: chain2,
	}
}

func MultiRelay(ctx context.Context, cfg *Config) *Relays {
	/*
		For each dst in chain config, we need to make one relay which raises two goroutines to
		communicate packets separately.

		Might need to initialize each chain client before proceeding

		Might need to send chain-pair in separate field in config
	*/

	/*
		relays := &relays{}
		for _, chainCfg := range cfg{
			for each dsts{
				initialize a new relay.
			}
		}
	*/

	/*
		chains := []interface{}{}
		for c := range []interface{}{} {

			chain := RegisteredClients["name"](chainConfig)
			chains = append(chains, chain)
		}

	*/
	return &Relays{}
}

func (r *Relays) StartMultiRelay(ctx context.Context) {
	relayCh := make(chan *relay, len(r.relay))

	for _, relay := range r.relay {
		relayCh <- relay
	}
	// handle panicking case
	for {
		select {
		case <-ctx.Done():
			fmt.Println("context cancelled")
			return
		case re := <-relayCh:
			go func(relay *relay) {
				fmt.Println("started multirelay")
				re.Start(ctx)
			}(re)
		}
	}

}

func (r *relay) Start(ctx context.Context) {
	fmt.Printf("Relay for %s and %s started\n", "ethereum", "aleo") // take from client name
}

func (r *relay) Init(ctx context.Context) {
	//panic if any error
}
