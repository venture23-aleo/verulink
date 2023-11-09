package ethereum

import (
	"context"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

type Sender struct {
	W      common.Wallet
	Src    string
	Dst    string
	Client *Client
}

func (s *Sender) Send(ctx context.Context, msg []*chain.QueuedMessage) (error) {
	// send according to safe and unsafe check
	// fmt.Println("trying to send ", msg.DepartureBlock)
	// randomNumber := rand.Intn(10)
	// if randomNumber%3 == 0 {
	// 	time.Sleep(5 * time.Second)
	// 	return 0, errors.New("send error")

	// } else {
	// 	time.Sleep(5 * time.Second)
	// 	return msg.DepartureBlock, nil
	// }
	return nil
}

func NewSender(src, dst, url string, wallet common.Wallet) chain.ISender { return &Sender{} }
