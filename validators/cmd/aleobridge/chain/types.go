package chain

import (
	"context"
	"time"
)

type ChainEvent struct {
}

type ICommon interface {
	Name() string
	GetFinalityHeight() uint64
	// GetChainEvents(ctx context.Context, eventCh chan<- *ChainEvent)
}

type ISender interface {
	ICommon
	// TODO: optimization might be achieved if packets can be sent in single txn
	// if the error is insufficient balance error, its better to send balance
	// at which this error occurred so that balance polling can be done precisely
	SendPacket(ctx context.Context, packet *Packet) (err error)

	IsPktTxnFinalized(ctx context.Context, pkt *Packet) (bool, error)

	// GetMinReqBalForMakingTxn returns minimum balance required to make a transaction.
	// Since size of transaction is fixed, it should return same value which also means
	// sender can store it in some struct field
	GetMinReqBalForMakingTxn() uint64
	// GetWalletBalance returns current balance of a wallet and error if encounters any
	GetWalletBalance(ctx context.Context) (uint64, error)
}

type IReceiver interface {
	ICommon

	// GetPktWithSeqGT will be called periodically by subscriber. Thus it shall return packet
	// which it shall put into the channel given by subscriber
	GetPktWithSeq(ctx context.Context, dest string, seqNum uint64) (*Packet, error)
	// GetPktsWithSeqGTAndInSameHeight will return packets of same height of packet with given seqNum.
	// This might make processing multiple packets that comes under same block efficient.
	// But might as well be obsolete
	GetPktsWithSeqAndInSameHeight(ctx context.Context, seqNum uint64) ([]*Packet, error)
	// Returns current height of chain
	CurHeight() uint64
	// Return average duration to generate a block by blockchain
	GetBlockGenTime() time.Duration
}

type NetworkAddress struct {
	ChainID string
	Address string
}

type Packet struct {
	// It is assigned by Storing function and will be populated in struct when retrieving from the db
	SeqByte []byte `json:"-"`

	Version     uint64
	Destination NetworkAddress
	Source      NetworkAddress
	Sequence    uint64
	Message     []byte
	Height      uint64
}

type QueuedMessage struct {
	RetryCount int8 // balance, network timeout,
	Message    *Packet
}
