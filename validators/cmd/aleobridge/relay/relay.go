package relay

import (
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
	Start()
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

func MultiRelay(cfg AppConfig) *Relays {
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

func (r *Relays) StartMultiRelay() {
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
		case re := <- relayCh:
			go func (relay *relay)  {
				re.Start()
			}(re)
		}
	}


}

func (r *relay) Start() {
	r.Src.Subscribe()
	r.Dst.Send()
}
