package aleo

import (
	"context"
	"os"
	"os/exec"
	"strings"

	"github.com/venture23-aleo/attestor/e2etest/chains/aleo/rpc"
	"github.com/venture23-aleo/attestor/e2etest/common"
)

type Client struct {
	name                string
	url                 string
	bridgeAddress       string
	tokenServiceAddress string
	rpc                 rpc.IAleoRPC
	privateKey          string
}

func (c *Client) CreatePacket() {

}

func NewClient(cfg *common.ChainConfig) *Client {
	endPoint := strings.Split(cfg.NodeUrl, "|")
	rpcClient, err := rpc.NewRPC(endPoint[0], endPoint[1])
	if err != nil {
		panic(err)
	}

	bt, err := os.ReadFile(cfg.WalletPath)
	if err != nil {
		panic(err)
	}

	return &Client{
		name:                cfg.Name,
		url:                 cfg.NodeUrl,
		bridgeAddress:       cfg.BridgeContractAddress,
		tokenServiceAddress: cfg.TokenServiceContractAddress,
		rpc:                 rpcClient,
		privateKey:          string(bt),
	}
}

func TransferEther(ctx context.Context) error {
	cmd := exec.CommandContext(ctx, "snarkos", "-h")
	output, err := cmd.Output()
	if err != nil {
		return err
	}
	_ = output
	return nil
}
