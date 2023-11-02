package ethereum

import (
	"context"
	"fmt"
	"math/big"
	"sort"
	"time"

	ethTypes "github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

type Receiver struct {
	Src    string
	Dst    string
	Client Client
}

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

func (r *Receiver) Subscribe(ctx context.Context, startHeight uint64) error {
	fmt.Println("subscribe the ethereum")
	client := NewClient("https://eth.llamarpc.com")
	
	latest := func() uint64{
		latestHeight, err := client.GetBlockNumber()
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
		err error 
	}
	
	for {
		select {
		case bn := <-bnCh:
			fmt.Println("eth notification", bn.Number, bn.Hash())
		case <-pollTicker.C:
			fmt.Println("poll ticker")
			latestHeight = latest()
		default:
			var headers []*notification
			if next >= latestHeight {
				// fmt.Println("continue")
				continue
			}

			qchLen := min(cap(bnCh), int(latestHeight - next))

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
						header, err := client.GetHeaderByHeight(ctx, big.NewInt(int64(q.height)))
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
	return &Receiver{}
}
