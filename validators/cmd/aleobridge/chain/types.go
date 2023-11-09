package chain

import (
	"context"
	"time"
)

type ISender interface {

	// returns []uint64 denoting which messages are sent, returns []*Packet to denote which packet batch could not be sent

	// TODO: optimization available attested message batch in a single txn
	Send(ctx context.Context, msg []*QueuedMessage) error
	GetRetryingBlocks() map[uint64]*QueuedMessage
}

type IReceiver interface {
	Subscribe(ctx context.Context, msgch chan<- *QueuedMessage, startHeight uint64) (errch <-chan error)
	GetLatestHeight(ctx context.Context) (uint64, error)
	HeightPoller() *time.Ticker
}

type NetworkAddress string

type Message []byte

type Packet struct {
	Version     uint64
	Destination NetworkAddress
	Source      NetworkAddress
	Sequence    uint64
	Message     Message
	Height      string
	Nonce       []byte
}

type QueuedMessage struct {
	DepartureBlock uint64
	RetryCount     int // balance, network timeout,
	Message        *Packet
}
