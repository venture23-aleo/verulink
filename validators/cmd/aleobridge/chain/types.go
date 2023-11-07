package chain

import (
	"context"
	"time"
)

type ISender interface {
	Send(ctx context.Context, msg *QueuedMessage) (uint64, error)
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
	RetryCount int
	Message        *Packet
}
