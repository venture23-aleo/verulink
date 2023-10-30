package aleo

import (
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

type Client struct{}

func (s *Sender) Send() {
	fmt.Println("send")
}

func NewSender(src, dst, url string, wallet common.Wallet) chain.ISender { return &Sender{} }
