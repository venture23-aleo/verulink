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
	aleoClient     *aleoRpc.Client
	finalizeHeight uint64
	chainID        uint32
	chainCfg       *relay.ChainConfig
	nextSeq        uint64
	receiverChns   map[string]chan *chain.Packet // chainID+contractAddress: chan Packet
}

// should make this function common accross all clients
func (cl *Client) StartReceiving(ctx context.Context) {
	guideCh := make(chan struct{}, 10)
	for {
		select {
		case <-ctx.Done():
			// handling done case
			return
		default:
		}

		var pkt *chain.Packet
		var err error

		// number of goroutines, 10 above, should match number of subscribing chains
		// otherwise one slow chain can affect other chains.
		// even so, one single chain can consume all goroutines and anyway having above issue
		// Warning: Chances of goroutine leakage
		// It can be mitigated if each channels can consume packet instantly.
		// Might need to store in map or database instantly for sender to process separately
		// Then we might not require goroutine as well.

		guideCh <- struct{}{}
		go func() {
			defer func() {
				<-guideCh
			}()
			pkt, err = cl.GetNextPacket(ctx)
			if err != nil {
				//handle error
			}

			cl.receiverChns[pkt.Destination.ChainID+pkt.Destination.Address] <- pkt
		}()

	}
}

func (cl *Client) GetNextPacket(ctx context.Context) (*chain.Packet, error) {
	var pkt *chain.Packet
	var err error
	for {
		pkt, err = cl.GetPktWithSeq(ctx, cl.nextSeq)
		if err != nil {
			//handle error
		}

		curHeight, err := cl.GetLatestHeight(ctx)
		if err != nil {
			// handle error
		}

		if pkt.Height+cl.finalizeHeight < curHeight {
			break
		}

		/*
			based on height difference calculate wait time and add time.Sleep here
		*/
	}
	cl.nextSeq++
	return pkt, nil
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
