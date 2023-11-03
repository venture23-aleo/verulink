package aleo

import (
	"context"
	"fmt"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

type Sender struct {
	W      common.Wallet
	Src    string
	Dst    string
	Client *Client
}

func (s *Sender) Send(ctx context.Context) {
	// send according to safe and unsafe check
	fmt.Println("send from aleo")
}

func NewSender(src, dst, url string, wallet common.Wallet) chain.ISender { return &Sender{} }
