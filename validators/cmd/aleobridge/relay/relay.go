package relay

import (
	"context"
	"fmt"

	ethTypes "github.com/ethereum/go-ethereum/core/types"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

type SenderFunc func(src, dst, url string, wallet common.Wallet) chain.ISender
type ReceiverFunc func(src string, dst string, nodeAddress string) chain.IReceiver

var (
	RegisteredSender   = map[string]SenderFunc{}
	RegisteredReceiver = map[string]ReceiverFunc{}
)

type Relay interface {
	Start(ctx context.Context)
}

type relay struct {
	Src chain.IReceiver
	Dst map[string]chain.ISender
	Cfg *ChainConfig
}

type Relays struct {
	relay []*relay
}

func NewRelay(src chain.IReceiver, dst map[string]chain.ISender) Relay {
	return &relay{
		Src: src,
		Dst: dst,
	}
}

func MultiRelay(ctx context.Context, cfg AppConfig) *Relays {
	multiRelay := &Relays{}
	wallets := map[string]common.Wallet{}

	for _, r := range cfg.Chains {
		wallet, _ := r.Wallet()
		wallets[r.Name] = wallet
	}
	for _, r := range cfg.Chains {
		switch r.Name {
		case "aleo":
			sender := map[string]chain.ISender{}
			dsts := []string{"ethereum"}
			receiver := RegisteredReceiver["aleo"](r.BridgeContract, dsts[0], r.NodeUrl) // change
			wallet, err := r.Wallet()
			if err != nil {
				return nil
			}
			wallets["aleo"] = wallet

			// handle for multiple destination

			for _, dst := range dsts {
				if dst == "ethereum" {
					sender[dst] = RegisteredSender[dst](r.BridgeContract, dst, r.NodeUrl, wallets[dst])
				}
			}
			multiRelay.relay = append(multiRelay.relay, &relay{
				Src: receiver,
				Dst: sender,
				Cfg: r,
			})
		case "ethereum":
			sender := map[string]chain.ISender{}
			dsts := []string{"aleo"}
			receiver := RegisteredReceiver["ethereum"](r.BridgeContract, dsts[0], r.NodeUrl)

			wallet, err := r.Wallet()
			if err != nil {
				return nil
			}
			wallets["ethereum"] = wallet

			for _, dst := range dsts {
				if dst == "aleo" {
					sender[dst] = RegisteredSender[dst](r.BridgeContract, dst, r.NodeUrl, wallets[dst])
				}
			}
			// Senders[r.BridgeContract] =
			multiRelay.relay = append(multiRelay.relay, &relay{
				Src: receiver,
				Dst: sender,
				Cfg: r,
			})
		}
	}
	return multiRelay
}

func (r *Relays) StartMultiRelay(ctx context.Context) {
	relayCh := make(chan *relay, len(r.relay))

	for _, relay := range r.relay {
		relayCh <- relay
	}

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
	fmt.Println("started individual relay")
	msgch := make(chan *ethTypes.Header)
	srcErrCh := r.Src.Subscribe(ctx, msgch, uint64(r.Cfg.StartHeight))

	for {
		select {
		case <-ctx.Done():
			return
		case err := <-srcErrCh:
			fmt.Println(err)
			return 
		case msg := <-msgch:
			fmt.Println("reached in the msg ch", msg.Number)
			// now send here
		}
	}
}
