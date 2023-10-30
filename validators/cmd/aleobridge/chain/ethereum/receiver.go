package ethereum

import "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"

type Receiver struct {
	Src    string
	Dst    string
	Client Client
}

func (r *Receiver) Subscribe() {

}

func NewReceiver(src string, dst string, nodeAddress string) chain.IReceiver { return &Receiver{} }
