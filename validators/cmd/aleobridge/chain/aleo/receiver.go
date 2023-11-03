package aleo

import (
	"context"
	"fmt"
	"log"
	"sort"
	"strconv"
	"time"

	"github.com/parajuliswopnil/aleo-go-sdk/rpc"
	aleoTypes "github.com/parajuliswopnil/aleo-go-sdk/types"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

var (
	SyncConcurrency = int64(200)
)

type Receiver struct {
	Src    string
	Dst    string
	Client Client
}

func NewClient(nodeURL, network string) IClient {
	aleoClient, err := rpc.NewClient(nodeURL, network)
	if err != nil {
		return nil
	}
	c := &Client{
		log:        log.Logger{},
		aleoClient: aleoClient,
	}
	return c
}

func (r *Receiver) Subscribe(ctx context.Context, msgch chan<- *chain.Packet, startHeight uint64) (errch <-chan error) {
	go func() {
		r.callLoop(ctx, startHeight,
			func(v *aleoTypes.Header) error {
				h := strconv.Itoa(int(v.Metadata.Height))
				msgch <- &chain.Packet{Height: h}
				return nil
			})
	}()
	return nil
}

func (r *Receiver) callLoop(ctx context.Context, startHeight uint64, callback func(v *aleoTypes.Header) error) {
	fmt.Println("subscribe the aleo")
	client := NewClient("https://vm.aleo.org/api", "testnet3")

	latest := func() uint64 {
		latestHeight, err := client.GetLatestHeight(ctx)
		if err != nil {
			return 0
		}
		return latestHeight
	}

	startHeight = latest()

	next, latestHeight := startHeight-10, latest()

	pollTicker := time.NewTicker(time.Minute / 2)

	// msgCh := make(chan chain.Message)

	bnCh := make(chan *aleoTypes.Header, 10)
	type notification struct {
		header *aleoTypes.Header
	}
	type query struct {
		height uint64
		bn     *notification
		err    error
	}

	for {
		select {
		case bn := <-bnCh:
			fmt.Println("aleo notification", bn.Metadata.Height)
			callback(bn)
		case <-pollTicker.C:
			fmt.Println("poll ticker")
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
						header, err := client.GetBlockHeaderByHeight(ctx, int64(q.height))
						if err != nil {
							q.err = err
						}
						q.bn.header = header
					}(q)
				}
			}
			if len(headers) > 0 {
				sort.SliceStable(headers, func(i, j int) bool {
					return headers[i].header.Metadata.Height < headers[j].header.Metadata.Height
				})
			}
			for _, header := range headers {
				bnCh <- header.header
			}
		}
	}

}

func NewReceiver(src string, dst string, nodeAddress string) chain.IReceiver { return &Receiver{} }
