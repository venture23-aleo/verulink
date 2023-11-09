package ethereum

import (
	"context"
	"fmt"
	"math/rand"
	"sync"
	"time"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

type Sender struct {
	mu         sync.RWMutex
	W          common.Wallet
	Src        string
	Dst        string
	Client     *Client
	RetryQueue map[uint64]*chain.QueuedMessage
}

func (s *Sender) Send(ctx context.Context, msg []*chain.QueuedMessage) error {
	for _, m := range msg {
		randomNumber := rand.Intn(10)
		if randomNumber%3 == 0 {
			time.Sleep(5 * time.Second)
			m.RetryCount++
			if _, ok := s.RetryQueue[m.DepartureBlock]; !ok {
				s.RetryQueue[m.DepartureBlock] =  m
			}
			fmt.Println("couldnot send ", m.DepartureBlock, m.RetryCount)

		} else {
			if _, ok := s.RetryQueue[m.DepartureBlock]; ok {
				fmt.Println("deleting sent blocks from retry")
				delete(s.RetryQueue, m.DepartureBlock)
			}
			fmt.Println("message sent", m.DepartureBlock, "retry count", m.RetryCount)
			time.Sleep(5 * time.Second)
		}
	}

	return nil
}

func (s *Sender) GetRetryingBlocks() map[uint64]*chain.QueuedMessage {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.RetryQueue
}

func NewSender(src, dst, url string, wallet common.Wallet) chain.ISender {
	return &Sender{RetryQueue: map[uint64]*chain.QueuedMessage{}}
}
