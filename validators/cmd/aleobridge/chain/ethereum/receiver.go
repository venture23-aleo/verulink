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

func (r *Receiver) Subscribe(ctx context.Context) {
	fmt.Println("subscribe the ethereum")
	client := NewClient("https://eth.llamarpc.com")
	startHeight := int64(5000)
	endHeight := int64(5100)
	for i := startHeight; i < endHeight; i++ {
		fmt.Println("ethereum subscription")
		go func(h int64) {
			header, err := client.GetHeaderByHeight(ctx, big.NewInt(h))
			if err!= nil {
				return 
			}
			fmt.Println(header.Hash())
		} (i)
	}
}

func NewReceiver(src string, dst string, nodeAddress string) chain.IReceiver { return &Receiver{} }
