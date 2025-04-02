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
	// program_name := "vlink_token_service_v3.aleo"
	// function_name := "token_send_public"
	token_id := "5809241989714636308107426316644412871372324308000354747397951595754453895773field"
	reciever := "[62u8, 96u8, 107u8, 122u8, 106u8, 179u8, 118u8, 99u8, 72u8, 95u8, 192u8, 62u8, 202u8, 221u8, 171u8, 143u8, 13u8, 193u8, 206u8, 214u8]"
	amount := "100u128"
	destination_chain_id := "443067135441324596u128"
	destination_token_service := "[187u8, 71u8, 143u8, 224u8, 60u8, 144u8, 255u8, 247u8, 119u8, 11u8, 87u8, 189u8, 240u8, 14u8, 235u8, 87u8, 111u8, 79u8, 79u8, 65u8]"
	destination_token_address := "[85u8, 94u8, 194u8, 73u8, 209u8, 235u8, 13u8, 181u8, 83u8, 174u8, 141u8, 241u8, 79u8, 75u8, 174u8, 40u8, 127u8, 156u8, 230u8, 42u8]"
	fee_platform := "1u128"
	is_relayer_on := "false"
	cmd := exec.CommandContext(ctx, "leo", "execute", "token_send_public", "--program", "vlink_token_service_v3.aleo", token_id, reciever,amount,destination_chain_id,destination_token_service,
	destination_token_address, fee_platform, is_relayer_on, "--private-key", c.privateKey, "--network", "testnet", "--endpoint", c.url, "--broadcast", "-y",
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
