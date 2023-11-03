package aleo

import (
	"context"
	"log"
	"strconv"
	"time"

	aleoRpc "github.com/parajuliswopnil/aleo-go-sdk/rpc"
	aleoTypes "github.com/parajuliswopnil/aleo-go-sdk/types"
)

type IClient interface {
	GetLatestHeight(ctx context.Context) (uint64, error)
	GetBlockHashByHeight(ctx context.Context, height int64) (string, error)
	GetBlockHeaderByHeight(ctx context.Context, height int64) (*aleoTypes.Header, error)
}

type Client struct {
	log        log.Logger
	aleoClient *aleoRpc.Client
	// bmc     *bmcperiphery.Bmcperiphery
	mock IClient
}

func (c *Client) GetLatestHeight(ctx context.Context) (uint64, error) {
	height, err := c.aleoClient.GetLatestHeight(ctx)
	if err != nil {
		return 0, err
	}
	return uint64(height), nil
}

func (c *Client) GetBlockHashByHeight(ctx context.Context, height int64) (string, error) {
	block, err := c.aleoClient.GetBlock(ctx, strconv.Itoa(int(height)))
	if err != nil {
		return "", err
	}
	return block.BlockHash, err
}

func (c *Client) GetBlockHeaderByHeight(ctx context.Context, height int64) (*aleoTypes.Header, error) {
	ctx_, cancel := context.WithTimeout(ctx, time.Minute)
	defer cancel()
	block, err := c.aleoClient.GetBlock(ctx_, strconv.Itoa(int(height)))
	if err != nil {
		return nil, err
	}
	return &block.Header, nil
}
