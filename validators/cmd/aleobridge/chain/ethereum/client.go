package ethereum

import (
	"context"
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
)

type destChain struct {
	name    string
	address string
}

type Client struct {
	eth               *ethclient.Client
	minRequiredGasFee uint64
	finalizeHeight    uint64
	blockGenTime      time.Duration
	chainID           uint32
	chainCfg          *relay.ChainConfig
	destChains        map[string]*destChain
}

func (cl *Client) GetPktWithSeq(ctx context.Context, dest string, seqNum uint64) (*chain.Packet, error) {
	return nil, nil
}

func (cl *Client) GetPktsWithSeqAndInSameHeight(ctx context.Context, seqNum uint64) ([]*chain.Packet, error) {
	packets := make([]*chain.Packet, 0)
	return packets, nil
}

// SendAttestedPacket sends packet from source chain to target chain
func (cl *Client) SendPacket(ctx context.Context, packet *chain.Packet) error {
	return nil
}

func (cl *Client) GetLatestHeight(ctx context.Context) (uint64, error) {
	return 0, nil
}

func (cl *Client) IsPktTxnFinalized(ctx context.Context, pkt *chain.Packet) (bool, error) {
	return false, nil
}

func (cl *Client) CurHeight() uint64 {
	return 0
}

func (cl *Client) GetFinalityHeight() uint64 {
	return cl.finalizeHeight
}

func (cl *Client) GetBlockGenTime() time.Duration {
	return cl.blockGenTime
}

func (cl *Client) GetDestChains() ([]string, error) {
	return nil, nil
}

func (cl *Client) GetChainEvent(ctx context.Context) (*chain.ChainEvent, error) {
	return nil, nil
}

func (cl *Client) GetMinReqBalForMakingTxn() uint64 {
	return cl.minRequiredGasFee
}

func (cl *Client) GetWalletBalance(ctx context.Context) (uint64, error) {
	return 0, nil
}

func (cl *Client) Name() string {
	return "Ethereum"
}

func NewClient(cfg *relay.ChainConfig) relay.IClient {
	/*
		Initialize eth client and panic if any error occurs.
		nextSeq should start from 1
	*/
	return &Client{}
}
