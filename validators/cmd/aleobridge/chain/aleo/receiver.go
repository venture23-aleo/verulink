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

const (
	AleoBlockFinality = 1
)

var (
	SyncConcurrency = int64(200)
)

type Receiver struct {
	Src    string
	Dst    string
	Client IClient
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

func (r *Receiver) Subscribe(ctx context.Context, msgch chan<- *chain.QueuedMessage, startHeight uint64) (errch <-chan error) {
	go func() {
		r.callLoop(ctx, startHeight,
			func(v *aleoTypes.Header) error {
				arrivalBlock := v.Metadata.Height
				h := strconv.Itoa(int(arrivalBlock))
				msgch <- &chain.QueuedMessage{DepartureBlock: uint64(arrivalBlock) + AleoBlockFinality, Message: &chain.Packet{Height: h}}
				return nil
			})
	}()
	return nil
}

func (r *Receiver) GetLatestHeight(ctx context.Context) (uint64, error) {
	latestHeight, err := r.Client.GetLatestHeight(ctx)
	if err != nil {
		return 0, err
	}
	return latestHeight, nil
}

func (r *Receiver) HeightPoller() *time.Ticker {
	heightPoller := time.NewTicker(time.Second * 15)
	return heightPoller
}

func (r *Receiver) callLoop(ctx context.Context, startHeight uint64, callback func(v *aleoTypes.Header) error) {
	fmt.Println("subscribe the aleo")

	latest := func() uint64 {
		latestHeight, err := r.Client.GetLatestHeight(ctx)
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
						header, err := r.Client.GetBlockHeaderByHeight(ctx, int64(q.height))
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

func NewReceiver(src string, dst string, nodeAddress string) chain.IReceiver {
	client := NewClient("https://vm.aleo.org/api", "testnet3")

	return &Receiver{
		Client: client,
	}
}
