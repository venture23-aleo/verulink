package aleo

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	aleoRpc "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/aleo/rpc"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/config"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

type MockClient struct {
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
	chainCfg *config.ChainConfig
	wallet   common.Wallet
}

func giveOutPackets(key string, seqNum uint64) (map[string]string, error) {
	packetString := "{\\n  version: 0u8,\\n  sequence: " + strconv.Itoa(int(seqNum)) + "u32,\\n  source: {\\n    chain_id: 2u32,\\n    addr: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px\\n  },\\n  destination: {\\n    chain_id: 1u32,\\n    addr: [\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      20u8,\\n      119u8,\\n      159u8,\\n      153u8,\\n      43u8,\\n      47u8,\\n      44u8,\\n      66u8,\\n      184u8,\\n      102u8,\\n      15u8,\\n      250u8,\\n      66u8,\\n      219u8,\\n      203u8,\\n      60u8,\\n      124u8,\\n      153u8,\\n      48u8,\\n      176u8\\n    ]\\n  },\\n  message: {\\n    token: [\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      20u8,\\n      119u8,\\n      159u8,\\n      153u8,\\n      43u8,\\n      47u8,\\n      44u8,\\n      66u8,\\n      184u8,\\n      102u8,\\n      15u8,\\n      250u8,\\n      66u8,\\n      219u8,\\n      203u8,\\n      60u8,\\n      124u8,\\n      153u8,\\n      48u8,\\n      176u8\\n    ],\\n    sender: aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn,\\n    receiver: [\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8\\n    ],\\n    amount: 102u64\\n  },\\n  height: 55u32\\n}"
	return map[string]string{key: packetString}, nil

}

func (cl *MockClient) GetPktWithSeq(ctx context.Context, dst uint32, seqNum uint64) (*chain.Packet, error) {
	mappingKey := constructOutMappingKey(dst, seqNum)
	message, err := giveOutPackets(mappingKey, seqNum)
	if err != nil {
		return nil, err
	}

	if message == nil {
		return nil, nil
	}
	pktStr := parseMessage(message[mappingKey])
	return parseAleoPacket(pktStr)
}

// SendAttestedPacket sends packet from source chain to target chain
func (cl *MockClient) SendPacket(ctx context.Context, packet *chain.Packet) error {
	if cl.isAlreadyExist() {
		return chain.AlreadyRelayedPacket{
			CurChainHeight: 0,
		}
	}
	aleoPacket := constructAleoPacket(packet)
	privateKey := cl.wallet.(*wallet).PrivateKey
	ctx, cancel := context.WithTimeout(ctx, time.Minute*2)
	defer cancel()
	cmd := cl.aleoClient.Send(ctx, aleoPacket, privateKey, cl.queryUrl, cl.network, priorityFee)
	output, err := cmd.Output()
	if err != nil {
		fmt.Println(err)
		return err
	}
	fmt.Println(string(output))
	return nil
}

func (cl *MockClient) isAlreadyExist() bool {
	return false
}

func (cl *MockClient) IsPktTxnFinalized(ctx context.Context, pkt *chain.Packet) (bool, error) {
	return false, nil
}

func (cl *MockClient) CurHeight(ctx context.Context) uint64 {
	height, err := cl.aleoClient.GetLatestHeight(ctx)
	if err != nil {
		return 0
	}
	return uint64(height)
}

func (cl *MockClient) GetFinalityHeight() uint64 {
	return cl.finalizeHeight
}

func (cl *MockClient) GetBlockGenTime() time.Duration {
	return cl.blockGenTime
}

func (cl *MockClient) GetDestChains() ([]string, error) {
	return []string{"ethereum"}, nil
}

func (cl *MockClient) GetMinReqBalForMakingTxn() uint64 {
	return cl.minRequiredGasFee
}

func (cl *MockClient) GetWalletBalance(ctx context.Context) (uint64, error) {
	return 0, nil
}

func (cl *MockClient) Name() string {
	return cl.name
}

func (cl *MockClient) GetChainID() uint32 {
	return cl.chainID
}

func NewMockClient(cfg *config.ChainConfig) relay.IClient {
	/*
		Initialize aleo MockClient and panic if any error occurs.
	*/
	urlSlice := strings.Split(cfg.NodeUrl, "|")
	if len(urlSlice) != 2 {
		panic("invalid format. Expected format:  <rpc_endpoint>|<network>:: example: http://localhost:3030|testnet3")
	}

	aleoMockClient, err := aleoRpc.NewMockRPC(urlSlice[0], urlSlice[1])
	if err != nil {
		return nil
	}

	wallet, err := loadWalletConfig(cfg.WalletPath)
	if err != nil {
		return nil
	}

	return &MockClient{
		queryUrl:       urlSlice[0],
		network:        urlSlice[1],
		aleoClient:     aleoMockClient,
		finalizeHeight: defaultFinalityHeight,
		chainID:        cfg.ChainID,
		blockGenTime:   blockGenerationTime,
		chainCfg:       cfg,
		wallet:         wallet,
		programID:      cfg.BridgeContract,
	}
}
