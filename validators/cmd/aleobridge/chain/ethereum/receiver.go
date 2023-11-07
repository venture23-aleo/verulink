package ethereum

import (
	"context"
	"fmt"
	"math/big"
	"sort"
	"strconv"
	"time"

	ethTypes "github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

type Receiver struct {
	Src    string
	Dst    string
	Client IClient
}

const (
	EthBlockFinality = 64
)

func NewClient(nodeUrl string) IClient {
	rpc, err := rpc.Dial(nodeUrl)
	if err != nil {
		return nil
	}
	client := &Client{
		eth: ethclient.NewClient(rpc),
	}
	return client
}

func (r *Receiver) Subscribe(ctx context.Context, msgch chan<- *chain.QueuedMessage, startHeight uint64) (errch <-chan error) {
	go func() {
		r.callLoop(ctx, startHeight, 
			func(v *ethTypes.Header) error{
				arrivalBlock := v.Number
				msgch <- &chain.QueuedMessage{DepartureBlock: arrivalBlock.Uint64() + EthBlockFinality, Message: &chain.Packet{Height: strconv.Itoa(int(v.Number.Int64()))}}
				return nil 
		})
	}()
	return nil 
}

func (r *Receiver) GetLatestHeight(ctx context.Context) (uint64, error){
	latestHeight, err := r.Client.GetBlockNumber()
	if err != nil {
		return 0, err
	}
	return latestHeight, nil 
}

func (r *Receiver) HeightPoller() (*time.Ticker) {
	heightPoller := time.NewTicker(time.Minute * 2)
	return heightPoller
}

func (r *Receiver) callLoop(ctx context.Context, startHeight uint64, callback func(v *ethTypes.Header) error) {
	fmt.Println("subscribe the ethereum")

	latest := func() uint64 {
		latestHeight, err := r.Client.GetBlockNumber()
		if err != nil {
			return 0
		}
		return latestHeight
	}

	startHeight = latest()

	next, latestHeight := startHeight, latest()

	pollTicker := time.NewTicker(time.Minute / 2)

	// msgCh := make(chan chain.Message)

	bnCh := make(chan *ethTypes.Header, 10)
	type notification struct {
		header *ethTypes.Header
	}
	type query struct {
		height uint64
		bn     *notification
		err    error
	}

	for {
		select {
		case bn := <-bnCh:
			callback(bn)
		case <-pollTicker.C:
			latestHeight = latest()
		default:
			var headers []*notification
			if next >= latestHeight {
				// fmt.Println("continue")
				continue
			}

			qchLen := min(cap(bnCh), int(latestHeight-next))

			qch := make(chan *query, qchLen)
			for i := next; i < latestHeight && len(qch) < cap(qch); i++ {
				next++
				qch <- &query{i, nil, nil}
			}
			for q := range qch {
				switch {
				case q.err != nil:
					q.bn, q.err = nil, nil
					qch <- q
					continue

				case q.bn != nil:
					headers = append(headers, q.bn)
					if len(headers) == cap(qch) {
						close(qch)
					}

				default:
					go func(q *query) {
						defer func() {
							qch <- q
						}()
						if q.bn == nil {
							q.bn = &notification{}
						}
						header, err := r.Client.GetHeaderByHeight(ctx, big.NewInt(int64(q.height)))
						if err != nil {
							q.err = err
						}
						q.bn.header = header
					}(q)
				}
			}
			if len(headers) > 0 {
				sort.SliceStable(headers, func(i, j int) bool {
					return headers[i].header.Number.Uint64() < headers[j].header.Number.Uint64()
				})
			}
			for _, header := range headers {
				bnCh <- header.header
			}
		}
	}

}

func NewReceiver(src string, dst string, nodeAddress string) chain.IReceiver {
	client := NewClient("https://rpc.mevblocker.io")
	return &Receiver{
		Client: client,
	}
}
