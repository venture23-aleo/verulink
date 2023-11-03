package chain

import (
	"context"
)

type ISender interface {
	Send(ctx context.Context)
}

type IReceiver interface {
	Subscribe(ctx context.Context, msgch chan<- *Packet, startHeight uint64) (errch <-chan error)
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
