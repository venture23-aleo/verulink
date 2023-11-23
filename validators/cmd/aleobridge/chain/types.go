package chain

import (
	"context"
)

type ISender interface {
	// TODO: optimization might be achieved if packets can be sent in single txn
	SendPacket(ctx context.Context, packet *Packet) error
	GetLatestHeight(ctx context.Context) (uint64, error)
	IsTxnFinalized(ctx context.Context, txnHash string) (bool, error)
}

type IReceiver interface {
	// TODO: move these methods elsewhere. This interface is
	// Subscribe(ctx context.Context, msgch chan<- *QueuedMessage, startHeight uint64) (errch <-chan error)
	// HeightPoller() *time.Ticker
	//        ^      ^        ^          ^
	//        |      |        |          |
	//        |      |        |          |
	/***************************************/

	// GetPktWithSeqGT will be called periodically by subscriber. Thus it shall return packet
	// which it shall put into the channel given by subscriber
	GetPktWithSeq(ctx context.Context, seqNum uint64) (*Packet, error)
	// GetPktsWithSeqGTAndInSameHeight will return packets of same height of packet with given seqNum.
	// This might make processing multiple packets that comes under same block efficient.
	// But might as well be obsolete
	GetPktsWithSeqAndInSameHeight(ctx context.Context, seqNum uint64) ([]*Packet, error)
}

type NetworkAddress struct {
	ChainID uint32
	Address string
}

type Packet struct {
	Version     uint64
	Destination NetworkAddress
	Source      NetworkAddress
	Sequence    uint64
	Message     []byte
	Height      string
}

type QueuedMessage struct {
	RetryCount int8 // balance, network timeout,
	Message    *Packet
}
