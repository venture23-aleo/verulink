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

func TransferUSDC(ctx context.Context) error {
	cmd := exec.CommandContext(ctx, "snarkos", "developer", "execute", "wusdc_connector_v0003.aleo", "wusdc_send",
		"[0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,22u8,196u8,62u8,31u8,147u8,239u8,217u8,175u8,205u8,17u8,252u8,181u8,163u8,153u8,0u8,0u8,221u8,17u8,86u8,96u8]",
		"1u128", "--private-key", "APrivateKey1zkpAypsxK9kpYJ8QetRAC3sXRZTSoJXYZCEBzywnHNTmmy5", "--query", "https://node.puzzle.online", "--broadcast",
		"https://node.puzzle.online/testnet3/transaction/broadcast", "--priority-fee", "100",
	)
	output, err := cmd.Output()
	if err != nil {
		return err
	}
	_ = output
	return nil
}
