package ethereum

import (
	"context"
	"fmt"
	"math/big"
	"time"

	ethBind "github.com/ethereum/go-ethereum/accounts/abi/bind"
	ethTypes "github.com/ethereum/go-ethereum/core/types"

	abi "github.com/venture23-aleo/attestor/chainService/chain/ethereum/abi"
	"github.com/venture23-aleo/attestor/chainService/config"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	"github.com/venture23-aleo/attestor/chainService/chain"
)

const (
	defaultFinalityHeight = 2
	blockGenerationTime   = time.Second * 12
	defaultRetryCount     = 5
	ethereum              = "ethereum"
	defaultGasLimit       = 1500000
	defaultGasPrice       = 130000000000
	defaultSendTxTimeout  = time.Second * 30
	defaultReadTimeout    = 50 * time.Second
)

type Client struct {
	name              string
	address           string
	eth               *ethclient.Client
	bridge            abi.ABIInterface
	minRequiredGasFee uint64
	waitDur           time.Duration
	startFrom         uint64
	chainID           uint32
}

func (cl *Client) GetPktWithSeq(ctx context.Context, dstChainID uint32, seqNum uint64) (*chain.Packet, error) {
	destChainIDBig := &big.Int{}
	destChainIDBig.SetUint64(uint64(dstChainID))
	sequenceNumber := &big.Int{}
	sequenceNumber.SetUint64(seqNum)

	ethpacket, err := cl.bridge.OutgoingPackets(&ethBind.CallOpts{Context: ctx}, destChainIDBig, sequenceNumber)
	if err != nil {
		return nil, err
	}

	packet := &chain.Packet{
		Version: ethpacket.Version.Uint64(),
		Destination: chain.NetworkAddress{
			ChainID: ethpacket.DestTokenService.ChainId.Uint64(),
			Address: ethpacket.DestTokenService.Addr,
		},
		Source: chain.NetworkAddress{
			ChainID: ethpacket.SourceTokenService.ChainId.Uint64(),
			Address: string(ethpacket.SourceTokenService.Addr.Bytes()),
		},
		Sequence: ethpacket.Sequence.Uint64(),
		Message: chain.Message{
			DestTokenAddress: ethpacket.Message.DestTokenAddress,
			Amount:           ethpacket.Message.Amount,
			ReceiverAddress:  ethpacket.Message.ReceiverAddress,
			SenderAddress:    string(ethpacket.Message.SenderAddress.Bytes()),
		},
		Height: ethpacket.Height.Uint64(),
	}
	return packet, nil
}

func (cl *Client) attestMessage(opts *ethBind.TransactOpts, packet abi.PacketLibraryInPacket) (tx *ethTypes.Transaction, err error) {
	tx, err = cl.bridge.ReceivePacket(opts, packet)
	return
}

func (cl *Client) curHeight(ctx context.Context) uint64 {
	height, err := cl.eth.BlockNumber(ctx)
	if err != nil {
		return 0
	}
	return height
}

func (cl *Client) Name() string {
	return cl.name
}

func (cl *Client) GetSourceChain() (string, string) {
	return cl.name, cl.address
}

func (cl *Client) GetChainID() uint32 {
	return cl.chainID
}

func NewClient(cfg *config.ChainConfig) chain.IClient {
	/*
		Initialize eth client and panic if any error occurs.
		nextSeq should start from 1
	*/
	rpc, err := rpc.Dial(cfg.NodeUrl)
	if err != nil {
		panic(fmt.Sprintf("failed to create ethereum rpc client. Error: %s", err.Error()))
	}

	ethclient := ethclient.NewClient(rpc)
	contractAddress := ethCommon.HexToAddress(cfg.BridgeContract)
	bridgeClient, err := abi.NewBridge(contractAddress, ethclient)
	if err != nil {
		panic(fmt.Sprintf("failed to create ethereum bridge client. Error: %s", err.Error()))
	}

	name := cfg.Name
	if name == "" {
		name = ethereum
	}
	waitDur := cfg.WaitDuration
	if waitDur == 0 {
		waitDur = defaultFinalityHeight
	}
	// todo: handle start height from stored height if start height in the config is 0
	return &Client{
		name:      name,
		address:   cfg.BridgeContract,
		eth:       ethclient,
		bridge:    bridgeClient,
		waitDur:   waitDur,
		chainID:   cfg.ChainID,
		startFrom: cfg.StartFrom,
	}
}

func (cl *Client) FeedPacket(ctx context.Context, ch chan<- *chain.Packet) {
	go cl.retryFeed(ctx, ch)

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}
		//
	}

}

func (cl *Client) retryFeed(ctx context.Context, ch chan<- *chain.Packet) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}
	}
}
