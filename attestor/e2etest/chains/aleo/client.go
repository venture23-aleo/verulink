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
	rpcClient, err := rpc.NewRPC(endPoint[0], endPoint[1])
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
	fmt.Println(c.url)
	fmt.Println(c.privateKey)
	cmd := exec.CommandContext(ctx, "snarkos", "developer", "execute", "wusdc_connector_v0002.aleo", "wusdc_send",
		"[0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,22u8,196u8,62u8,31u8,147u8,239u8,217u8,175u8,205u8,17u8,252u8,181u8,163u8,153u8,0u8,0u8,221u8,17u8,86u8,96u8]",
		"1u128", "--private-key", c.privateKey, "--query", c.url, "--broadcast",
		c.url+"/testnet3/transaction/broadcast", "--priority-fee", "100",
	)
	_, err := cmd.Output()
	if err != nil {
		return err
	}
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
