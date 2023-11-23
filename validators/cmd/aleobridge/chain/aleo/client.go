package aleo

import (
	"context"

	aleoRpc "github.com/parajuliswopnil/aleo-go-sdk/rpc"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
)

const (
	AleoBlockFinality = 1
)

type Client struct {
	aleoClient *aleoRpc.Client
	chainID    uint32
	chainCfg   *relay.ChainConfig
}

func (cl *Client) GetPktWithSeq(ctx context.Context, seqNum uint64) (*chain.Packet, error) {
	return &chain.Packet{}, nil
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

func (cl *Client) IsTxnFinalized(ctx context.Context, txnHash string) (bool, error) {
	return false, nil
}

func (cl *Client) Name() string {
	return "Ethereum"
}

func NewClient(cfg *relay.ChainConfig) relay.IClient {
	/*
		Initialize aleo client and panic if any error occurs.
	*/
	return &Client{}
}
