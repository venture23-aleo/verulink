package aleo

import (
	"context"
	"encoding/json"
	"os"
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
	defaultFinalizingHeight = 1
	blockGenerationTime     = time.Second * 5
	out_packet              = "out_packets"
	priorityFee             = "1000"
	aleo                    = "aleo"
)

type Client struct {
	aleoClient        aleoRpc.IAleoRPC
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

func (cl *Client) GetPktWithSeq(ctx context.Context, dst uint32, seqNum uint64) (*chain.Packet, error) {
	mappingKey := constructOutMappingKey(dst, seqNum)
	message, err := cl.aleoClient.GetMappingValue(ctx, cl.programID, out_packet, mappingKey)
	if err != nil {
		return nil, err
	}

	pktStr := parseMessage(message[mappingKey])
	return parseAleoPacket(pktStr)
}

// SendAttestedPacket sends packet from source chain to target chain
// TODO: output parser
func (cl *Client) SendPacket(ctx context.Context, packet *chain.Packet) error { //TODO: seems to panic at misformed packet so need to handle that
	if cl.isAlreadyExist() {
		return chain.AlreadyRelayedPacket{
			CurChainHeight: 0,
		}
	}
	aleoPacket := constructAleoPacket(packet)
	privateKey := cl.wallet.(*wallet).PrivateKey

	_ctx, cancel := context.WithTimeout(ctx, time.Second*25)
	defer cancel()
	cmd := cl.aleoClient.Send(_ctx, aleoPacket, privateKey, cl.queryUrl, cl.network, priorityFee)
	defer cmd.Cancel()
	for {
		select {
		case <-_ctx.Done():
			return ctx.Err()
		default:
			output, err := cmd.Output()
			if err != nil {
				logger.Logger.Error("error while sending packet", zapcore.Field{Interface: err})
				return err
			}
			logger.Logger.Info("packet sent to aleo::output::", zapcore.Field{String: string(output)})
			return nil
		}
	}
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
	return cl.name
}

func (cl *Client) GetChainID() uint32 {
	return cl.chainID
}

func loadWalletConfig(file string) (common.Wallet, error) {
	walletBt, err := os.ReadFile(file) // wallet byte
	if err != nil {
		return nil, err
	}
	w := &wallet{}
	err = json.Unmarshal(walletBt, w)
	if err != nil {
		return nil, err
	}
	return w, nil

}

func NewClient(cfg *relay.ChainConfig) relay.IClient {
	/*
		Initialize aleo client and panic if any error occurs.
	*/
	urlSlice := strings.Split(cfg.NodeUrl, "|")
	if len(urlSlice) != 2 {
		panic("invalid format. Expected format:  <rpc_endpoint>|<network>:: example: http://localhost:3030|testnet3")
	}

	aleoClient, err := aleoRpc.NewRPC(urlSlice[0], urlSlice[1])
	if err != nil {
		return nil
	}

	wallet, err := loadWalletConfig(cfg.WalletPath)
	if err != nil {
		return nil
	}

	name := cfg.Name
	finalizeHeight := cfg.FinalityHeight
	if name == "" {
		name = aleo
	}
	if finalizeHeight == 0 {
		finalizeHeight = defaultFinalizingHeight
	}

	return &Client{
		queryUrl:       urlSlice[0],
		network:        urlSlice[1],
		aleoClient:     aleoClient,
		finalizeHeight: uint64(finalizeHeight),
		chainID:        cfg.ChainID,
		blockGenTime:   blockGenerationTime,
		chainCfg:       cfg,
		wallet:         wallet,
		programID:      cfg.BridgeContract,
		name:           name,
	}
}
