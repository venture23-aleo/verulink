package relay

import (
	"context"
	"time"

	"github.com/venture23-aleo/attestor/chainService/chain"
)

// params
const (
	srcChainID  = "src_chain_id"
	destChainID = "dest_chain_id"
	seqNum      = "seq_num"
	signature   = "signature"
	isWhite     = "is_white"
)

func sendToCollector(sp *chain.ScreenedPacket, signature string) error {

	params := map[string]interface{}{
		srcChainID:  sp.Packet.Source.ChainID,
		destChainID: sp.Packet.Destination.ChainID,
		seqNum:      sp.Packet.Sequence,
		signature:   signature,
		isWhite:     sp.IsWhite,
	}

	_ = params
	// todo: need to send srcChainId, destChainID, packetSeqNum, signature and probably isWhite

	// use common.AlreadyRelayedPacket{} error for already sent packet
	return nil
}

func receivePktsFromCollector(ctx context.Context, ch chan<- *chain.Packet) {
	ticker := time.NewTicker(time.Hour * 12) // todo: take from config
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

	}
}

func verifyPkt(ctx context.Context, pkt *chain.Packet) (bool, error) {
	return false, nil
}
