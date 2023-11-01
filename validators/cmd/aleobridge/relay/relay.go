package relay

import (
	"context"
	"fmt"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/aleo"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/ethereum"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

type SenderFunc func(src, dst, url string, wallet common.Wallet) chain.ISender
type ReceiverFunc func(src string, dst string, nodeAddress string) chain.IReceiver

var (
	Senders   = map[string]SenderFunc{}
	Receivers = map[string]ReceiverFunc{}
)

type Relay interface {
	Start(ctx context.Context)
}

type relay struct {
	Src chain.IReceiver
	Dst chain.ISender
}

type Relays struct {
	relay []*relay
}

func NewRelay(src chain.IReceiver, dst chain.ISender) Relay {
	return &relay{
		Src: src,
		Dst: dst,
	}
}

func MultiRelay(ctx context.Context, cfg AppConfig) *Relays {
	multiRelay := &Relays{}
	for _, r := range cfg.Chains {
		switch r.Name {
		case "aleo":
			Receivers[r.BridgeContract] = aleo.NewReceiver
			var dst string
			receiver := Receivers[r.BridgeContract](r.BridgeContract, dst, r.NodeUrl)

			Senders[r.BridgeContract] = ethereum.NewSender
			wallet, _ := r.Wallet()
			sender := Senders[r.BridgeContract](r.BridgeContract, dst, r.NodeUrl, wallet)
			multiRelay.relay = append(multiRelay.relay, &relay{
				Src: receiver,
				Dst: sender,
			})
		case "ethereum":
			Receivers[r.BridgeContract] = ethereum.NewReceiver
			var dst string
			receiver := Receivers[r.BridgeContract](r.BridgeContract, dst, r.NodeUrl)

			Senders[r.BridgeContract] = aleo.NewSender
			wallet, _ := r.Wallet()
			sender := Senders[r.BridgeContract](r.BridgeContract, dst, r.NodeUrl, wallet)
			multiRelay.relay = append(multiRelay.relay, &relay{
				Src: receiver,
				Dst: sender,
			})
		}
	}
	return multiRelay
}

func (r *Relays) StartMultiRelay(ctx context.Context) {
	relayCh := make(chan *relay, len(r.relay))

	for _, relay := range(r.relay) {
		relayCh <- relay
	}


	// for {
	// 	switch{
	// 		case re = <-relayCh:
	// 			go func(rel *relay) {
	// 				rel.Start()
	// 			}(re)
				
	// 	}
	// }
	
	for {
		select {
		case <- ctx.Done():
			fmt.Println("context cancelled")
			return 
		case re := <- relayCh:
			go func (relay *relay)  {
				fmt.Println("started multirelay")
				re.Start(ctx)
			}(re)
		}
	}


}

func (r *relay) Start(ctx context.Context) {
	fmt.Println("started individual relay")
	r.Src.Subscribe(ctx)
	r.Dst.Send(ctx)
}
