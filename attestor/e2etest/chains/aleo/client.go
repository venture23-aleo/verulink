package aleo

import (
	"context"
	"fmt"
	"os/exec"
	"strconv"
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
	rpcClient, err := rpc.NewRPC("http://localhost:3000", endPoint[1])
	if err != nil {
		panic(err)
	}

	return &Client{
		name:                cfg.Name,
		url:                 endPoint[0],
		bridgeAddress:       cfg.BridgeContractAddress,
		tokenServiceAddress: cfg.TokenServiceContractAddress,
		rpc:                 rpcClient,
		privateKey:          cfg.WalletPath,
	}
}

func (c *Client) TransferUSDC(ctx context.Context) error {
	fmt.Println("here we are", c.privateKey, c.url)
	cmd := exec.CommandContext(ctx, "snarkos", "developer", "execute", "wusdc_connector_v0001_1.aleo", "wusdc_send",
		"[232u8, 173u8, 26u8, 65u8, 73u8, 166u8, 25u8, 249u8, 9u8, 115u8, 238u8, 73u8, 233u8, 16u8, 8u8, 81u8, 150u8, 224u8, 242u8, 37u8]",
		"101u128", "--private-key", c.privateKey, "--network", "1", "--query", c.url, "--broadcast",
		c.url+"/testnet/transaction/broadcast",
	)
	output, err := cmd.Output()

	if err != nil {
		fmt.Println("faced err ", err)
		return err
	}
	fmt.Println(string(output))
	return nil
}

func (c *Client) GetLatestSequenceNumber(ctx context.Context) uint64 {
	fmt.Println(c.bridgeAddress)
	sequenceMap, err := c.rpc.GetMappingValue(ctx, c.bridgeAddress, "sequences", "28556963657430695u128")
	if err != nil {
		fmt.Println(err)
		return 0
	}
	seqString := sequenceMap["28556963657430695u128"]
	replacer := strings.NewReplacer("\"", "", "\\", "", "u64", "")
	seqString = replacer.Replace(seqString)
	sequenceInt, err := strconv.Atoi(seqString)
	if err != nil {
		fmt.Println(err)
		return 0
	}

	return uint64(sequenceInt)
}
