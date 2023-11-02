package aleo

import (
	"context"
	"fmt"
	"testing"

	"github.com/parajuliswopnil/aleo-go-sdk/rpc"
	"github.com/stretchr/testify/assert"
)

func TestGetLatestHeight(t *testing.T) {
	aleoClient, err := rpc.NewClient("https://vm.aleo.org/api", "testnet3")
	if err != nil {
		return
	}

	c := Client{
		aleoClient: aleoClient,
	}

	latestHeight, err := c.GetBlockHashByHeight(context.Background(), 5000)
	assert.Nil(t, err)
	fmt.Println(latestHeight)
}
