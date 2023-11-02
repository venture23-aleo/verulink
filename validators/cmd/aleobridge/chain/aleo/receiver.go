package aleo

import (
	"context"
	"fmt"
	"log"

	"github.com/parajuliswopnil/aleo-go-sdk/rpc"
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

func NewClient(nodeURL, network string) IClient{
	aleoClient, err := rpc.NewClient(nodeURL, network)
	if err != nil {
		return nil
	}
	c := &Client {
		log: log.Logger{},
		aleoClient: aleoClient,
	}
	return c
}

func (r *Receiver) Subscribe(ctx context.Context, startHeight int64) {
	fmt.Println("subsribe the aleo")
	client := NewClient("https://vm.aleo.org/api", "testnet3")
	latestHeight  := startHeight + 200
	// if err != nil {
	// 	return 
	// }
	for i:= startHeight; i < latestHeight; i++ {
		fmt.Println("aleo subsription")
		go func(h int64) {
			hash, err := client.GetBlockHashByHeight(ctx, h)
			if err != nil {
				return
			}
			fmt.Println("aleo hash", hash)
		}(int64(i))
	}
}

func NewReceiver(src string, dst string, nodeAddress string) chain.IReceiver { return &Receiver{} }
