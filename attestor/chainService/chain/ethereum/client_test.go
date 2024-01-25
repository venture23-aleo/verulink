package ethereum

import (
	"context"
	"fmt"
	"math/big"
	"testing"

	eth "github.com/ethereum/go-ethereum"
	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	abi "github.com/venture23-aleo/attestor/chainService/chain/ethereum/abi"
)

func TestFilterLogs(t *testing.T) {
	rpc, err := rpc.Dial("https://ethereum-sepolia.publicnode.com")
	if err != nil {
		panic(fmt.Sprintf("failed to create ethereum rpc client. Error: %s", err.Error()))
	}

	ethclient := ethclient.NewClient(rpc)
	contractAddress := ethCommon.HexToAddress("0x718721F8A5D3491357965190f5444Ef8B3D37553")
	bridgeClient, err := abi.NewBridge(contractAddress, ethclient)
	if err != nil {
		panic(err)
	}
	client := &Client{
		eth:    ethclient,
		bridge: bridgeClient,
	}

	logs, err := client.eth.FilterLogs(context.Background(), eth.FilterQuery{
		FromBlock: big.NewInt(5113030),
		ToBlock:   big.NewInt(5124030),
		Addresses: []ethCommon.Address{contractAddress},
		Topics: [][]ethCommon.Hash{
			{ethCommon.HexToHash("0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9")},
		},
	})
	if err != nil {
		panic(err)
	}
	for _, v := range logs {
		packet, err := client.bridge.ParsePacketDispatched(v)
		if err != nil {
			fmt.Println(err)
			continue
		}
		_ = packet
	}

}
