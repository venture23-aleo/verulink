package relay

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

type SenderFunc func(src, dst, url string, wallet common.Wallet) chain.ISender
type ReceiverFunc func(src string, dst string, nodeAddress string) chain.IReceiver

const (
	DefaultSendMessageTicker = 10 * time.Second
	DefaultTxRetryCount      = 0
)

var (
	RegisteredSender   = map[string]SenderFunc{}
	RegisteredReceiver = map[string]ReceiverFunc{}
)

type MsgQueue struct {
	mu               sync.RWMutex
	QueuedMessage    []*chain.QueuedMessage
	FinalizedMessage map[string][]*chain.QueuedMessage
}

func NewQueue() *MsgQueue {
	var queuedMsg []*chain.QueuedMessage
	finalizedQueue := map[string][]*chain.QueuedMessage{}
	return &MsgQueue{sync.RWMutex{}, queuedMsg, finalizedQueue}
}

func (q *MsgQueue) AppendQueuedMessage(msg *chain.QueuedMessage) {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.QueuedMessage = append(q.QueuedMessage, msg)
}

func (q *MsgQueue) AppendFinalizedMessage(dst string, msg *chain.QueuedMessage) {
	q.mu.Lock()
	defer q.mu.Unlock()
	q.FinalizedMessage[dst] = append(q.FinalizedMessage[dst], msg)
}

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
	fmt.Println("started individual relay")
	msgch := make(chan *chain.QueuedMessage)
	srcErrCh := r.Src.Subscribe(ctx, msgch, uint64(r.Cfg.StartHeight))

	msgQ := NewQueue()

	// var messageQueue []*chain.QueuedMessage
	// var finalizedQueue []*chain.QueuedMessage

	heightTicker := r.Src.HeightPoller()

	sendMessageTicker := time.NewTicker(DefaultSendMessageTicker)
	retryTicker := time.NewTicker(time.Minute)

	for {
		select {
		case <-ctx.Done():
			return
		case err := <-srcErrCh:
			fmt.Println(err)
			return
		case msg := <-msgch:
			fmt.Println("reached in the msg ch", msg.DepartureBlock, msg.DepartureBlock)
			msgQ.AppendQueuedMessage(msg)
			fmt.Println(len(msgQ.QueuedMessage))
			// now send here
		case <-heightTicker.C:
			fmt.Println(len(msgQ.QueuedMessage))
			if len(msgQ.QueuedMessage) > 0 {
				for i := 0; i < len(msgQ.QueuedMessage); i++ {
					// filter messages according to the destination
					msgDest := string(msgQ.QueuedMessage[i].Message.Destination)
					msgQ.AppendFinalizedMessage(msgDest, msgQ.QueuedMessage[i])
					fmt.Println("from height ticker in relay ", msgQ.QueuedMessage[i].DepartureBlock)
					msgQ.QueuedMessage[i] = nil

				}
				var _msgQ []*chain.QueuedMessage
				_msgQ, msgQ.QueuedMessage = msgQ.QueuedMessage, msgQ.QueuedMessage[0:0]
				// remove nil
				for _, m := range _msgQ {
					if m != nil {
						msgQ.AppendQueuedMessage(m)
					}
				}
			}
		case <-sendMessageTicker.C:
			finalQLen := len(msgQ.FinalizedMessage)
			if finalQLen > 0 {
				for k := range msgQ.FinalizedMessage {
					dstMsgLength := len(msgQ.FinalizedMessage[k])
					fmt.Println("dst msg len pre: ", dstMsgLength)
					err := r.Dst[k].Send(ctx, msgQ.FinalizedMessage[k])
					if err != nil {
						return
					}
					msgQ.FinalizedMessage[k] = msgQ.FinalizedMessage[k][dstMsgLength:]
					fmt.Println("dst msg len post: ", len(msgQ.FinalizedMessage[k]))
				}
			}
		case <-retryTicker.C:
			for k := range r.Dst {
				retryBlocks := r.Dst[k].GetRetryingBlocks()
				for _, v := range retryBlocks {
					fmt.Println("sending retrying message", v.DepartureBlock)
					err := r.Dst[k].Send(ctx, []*chain.QueuedMessage{v})
					if err != nil {
						return
					}
				}
			}
		}
	}
}
