package aleo

import (
	"context"
	"log"
	"strconv"

	aleoRpc "github.com/parajuliswopnil/aleo-go-sdk/rpc"
)

type IClient interface {
	GetLatestHeight(ctx context.Context) (int64, error)
	GetBlockHashByHeight(ctx context.Context, height int64) (string, error)
}

type Client struct {
	log        log.Logger
	aleoClient *aleoRpc.Client
	// bmc     *bmcperiphery.Bmcperiphery
	mock IClient
}

func (c *Client) GetLatestHeight(ctx context.Context) (int64, error) {
	height, err := c.aleoClient.GetLatestHeight()
	if err != nil {
		return 0, err
	}
	return height, nil
}

func (c *Client) GetBlockHashByHeight(ctx context.Context, height int64) (string, error){
	block, err := c.aleoClient.GetBlock(strconv.Itoa(int(height)))
	if err != nil {
		return "", err 
	}
	return block.BlockHash, err
}
