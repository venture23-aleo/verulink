package aleo

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	aleoRpc "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/aleo/rpc"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/logger"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
	"go.uber.org/zap/zapcore"
)

const (
	DefaultFinalizingHeight = 1
	BlockGenerationTime     = time.Second * 5
	OUT_PACKET              = "out_packets"
	PRIORITY_FEE            = "1000"
)

type Client struct {
	aleoClient        *aleoRpc.Client
	name              string
	programID         string
	queryUrl          string
	network           string
	chainID           uint32
	finalizeHeight    uint64
	blockGenTime      time.Duration
	minRequiredGasFee uint64

	//
	chainCfg *relay.ChainConfig
	wallet   common.Wallet
}

type aleoPacket struct {
	version     string
	source      aleoPacketNetworkAddress
	sequence    string
	destination aleoPacketNetworkAddress
	message     aleoMessage
	height      string
}

type aleoPacketNetworkAddress struct {
	chain_id string
	address  string
}

type aleoMessage struct {
	token    string
	receiver string
	amount   string
	sender   string
}

func constructOutMappingKey(dst uint32, seqNum uint64) (mappingKey string) {
	return fmt.Sprintf("{chain_id:%du32,sequence:%du32}", dst, seqNum)
}

func (cl *Client) GetPktWithSeq(ctx context.Context, dst uint32, seqNum uint64) (*chain.Packet, error) {
	mappingKey := constructOutMappingKey(dst, seqNum)
	message, err := cl.aleoClient.GetMappingValue(ctx, cl.programID, OUT_PACKET, mappingKey)
	if err != nil {
		return nil, err
	}

	pktStr := parseMessage(message[mappingKey])
	return parseAleoPacket(pktStr)
}

// SendAttestedPacket sends packet from source chain to target chain
func (cl *Client) SendPacket(ctx context.Context, packet *chain.Packet) error {
	if cl.isAlreadyExist() {
		return chain.AlreadyRelayedPacket{
			CurChainHeight: 0,
		}
	}
	aleoPacket := cl.constructAleoPacket(packet)
	privateKey := cl.wallet.(*ALEOWallet).PrivateKey
	cmd := exec.CommandContext(context.Background(),
		"snarkos", "developer", "execute", "bridge.aleo", "attest",
		aleoPacket,
		"--private-key", privateKey,
		"--query", cl.queryUrl,
		"--broadcast", cl.queryUrl+"/"+cl.network+"/transaction/broadcast",
		"--priority-fee", PRIORITY_FEE)

	output, err := cmd.Output()
	if err != nil {
		return err
	}
	logger.Logger.Info("packet sent to aleo::output::", zapcore.Field{String: string(output)})
	return nil
}

func (cl *Client) isAlreadyExist() bool {
	return false
}

func (cl *Client) IsPktTxnFinalized(ctx context.Context, pkt *chain.Packet) (bool, error) {
	return false, nil
}

func (cl *Client) CurHeight(ctx context.Context) uint64 {
	height, err := cl.aleoClient.GetLatestHeight(ctx)
	if err != nil {
		return 0
	}
	return uint64(height)
}

func (cl *Client) GetFinalityHeight() uint64 {
	return cl.finalizeHeight
}

func (cl *Client) GetBlockGenTime() time.Duration {
	return cl.blockGenTime
}

func (cl *Client) GetDestChains() ([]string, error) {
	return []string{"ethereum"}, nil
}

func (cl *Client) GetMinReqBalForMakingTxn() uint64 {
	return cl.minRequiredGasFee
}

func (cl *Client) GetWalletBalance(ctx context.Context) (uint64, error) {
	return 0, nil
}

func (cl *Client) Name() string {
	return "Aleo"
}

func (cl *Client) GetChainID() uint32 {
	return cl.chainID
}

func loadWalletConfig(file string) (common.Wallet, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	aleoWallet := &ALEOWallet{}
	err = json.NewDecoder(f).Decode(aleoWallet)
	if err != nil {
		return nil, err
	}
	return aleoWallet, nil

}

func NewClient(cfg *relay.ChainConfig) relay.IClient {
	/*
		Initialize aleo client and panic if any error occurs.
	*/
	urlSlice := strings.Split(cfg.NodeUrl, "|")
	if len(urlSlice) != 2 {
		panic("invalid format. Expected format:  <rpc_endpoint>|<network>:: example: http://localhost:3030|testnet3")
	}

	aleoClient, err := aleoRpc.NewClient(urlSlice[0], urlSlice[1])
	if err != nil {
		return nil
	}

	wallet, err := loadWalletConfig(cfg.WalletPath)
	if err != nil {
		return nil
	}

	return &Client{
		queryUrl:       urlSlice[0],
		network:        urlSlice[1],
		aleoClient:     aleoClient,
		finalizeHeight: DefaultFinalizingHeight,
		chainID:        cfg.ChainID,
		blockGenTime:   BlockGenerationTime,
		chainCfg:       cfg,
		wallet:         wallet,
		programID:      cfg.BridgeContract,
	}
}
