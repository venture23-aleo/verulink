package chain

import (
	"context"
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
	SendPacket(ctx context.Context, packet *Packet) (txnHash string, err error)

	// seems not required
	// GetLatestHeight(ctx context.Context) (uint64, error)
	IsTxnFinalized(ctx context.Context, txnHash string) (bool, error)

	// GetMinReqBalForMakingTxn returns minimum balance required to make a transaction.
	// Since size of transaction is fixed, it should return same value which also means
	// sender can store it in some struct field
	GetMinReqBalForMakingTxn() int
	// GetWalletBalance returns current balance of a wallet and error if encounters any
	GetWalletBalance(ctx context.Context) (int, error)
}

type IReceiver interface {
	ICommon

	// GetPktWithSeqGT will be called periodically by subscriber. Thus it shall return packet
	// which it shall put into the channel given by subscriber
	GetPktWithSeq(ctx context.Context, seqNum uint64) (*Packet, error)
	// GetPktsWithSeqGTAndInSameHeight will return packets of same height of packet with given seqNum.
	// This might make processing multiple packets that comes under same block efficient.
	// But might as well be obsolete
	GetPktsWithSeqAndInSameHeight(ctx context.Context, seqNum uint64) ([]*Packet, error)
	// Returns current height of chain
	CurHeight() uint64
}

type NetworkAddress struct {
	ChainID string
	Address string
}

type Packet struct {
	// Ts is timestamp as byte which is used as key to store in key-value db.
	// It is assigned by Storing function and will be populated in struct when retrieving from the db
	TSByte []byte `json:"-"`
	//
	Version     uint64
	Destination NetworkAddress
	Source      NetworkAddress
	Sequence    uint64
	Message     []byte
	Height      uint64
}

type TxnPacket struct {
	// Ts is timestamp as byte which is used as key to store in key-value db.
	// It is assigned by Storing function and will be populated in struct when retrieving from the db
	SeqByte []byte `json:"-"`
	TxnHash string
	Pkt     *Packet
}

type QueuedMessage struct {
	RetryCount int8 // balance, network timeout,
	Message    *Packet
}
