package ethereum

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	"github.com/stretchr/testify/assert"
)

func TestHeaderByHeight(t *testing.T) {
	rpc, err := rpc.Dial("https://eth.llamarpc.com")
	assert.Nil(t, err)
	client := &Client{
		eth: ethclient.NewClient(rpc),
	}

	header, err := client.GetHeaderByHeight(context.Background(), big.NewInt(3000))
	assert.Nil(t, err)
	bt, err := json.Marshal(header)
	assert.Nil(t, err)
	fmt.Println(string(bt))
}

func TestBalance(t *testing.T) {
	rpc, err := rpc.Dial("https://eth.llamarpc.com")
	assert.Nil(t, err)
	client := &Client{
		eth: ethclient.NewClient(rpc),
	}

	balance, err := client.GetBalance(context.Background(), "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0")
	assert.Nil(t, err)

	fmt.Println(balance)
}

func TestBlockNumber(t *testing.T) {
	rpc, err := rpc.Dial("https://eth.llamarpc.com")
	assert.Nil(t, err)
	client := &Client{
		eth: ethclient.NewClient(rpc),
	}

	number, err := client.GetBlockNumber()
	assert.Nil(t, err)
	fmt.Println(number)
}

func TestBlockByHash(t *testing.T) {
	rpc, err := rpc.Dial("https://eth.llamarpc.com")
	assert.Nil(t, err)
	client := &Client{
		eth: ethclient.NewClient(rpc),
	}

	block, err := client.GetBlockByHash(common.HexToHash("0x4ce243c788b68f510d1227a5c672a8a4e760534466c9052d319a8c090c5df450"))
	assert.Nil(t, err)
	fmt.Println(block)
}


