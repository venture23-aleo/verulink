package ethereum

import (
	"context"
	"fmt"
	"math/big"

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

func (r *Receiver) Subscribe(ctx context.Context, startHeight int64) {
	fmt.Println("subscribe the ethereum")
	client := NewClient("https://eth.llamarpc.com")
	latestHeight := startHeight + 200
	for i := startHeight; i < latestHeight; i++ {
		fmt.Println("ethereum subscription")
		go func(h int64) {
			header, err := client.GetHeaderByHeight(ctx, big.NewInt(h))
			if err!= nil {
				return 
			}
			fmt.Println("ethereum", header.Number, header.Hash())
		} (i)
	}
}

func NewReceiver(src string, dst string, nodeAddress string) chain.IReceiver { 
	return &Receiver{} 
}
