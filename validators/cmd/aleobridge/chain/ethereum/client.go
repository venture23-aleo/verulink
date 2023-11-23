package ethereum

import (
	"context"
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
)

type Client struct {
	eth      *ethclient.Client
	chainID  uint32
	chainCfg *relay.ChainConfig
}

const (
	defaultReadTimeout = 50 * time.Second
	RPCCallRetry       = 5
)

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
		Initialize eth client and panic if any error occurs.
	*/
	return &Client{}
}
