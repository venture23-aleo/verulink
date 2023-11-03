package chain

import (
	"context"

	ethTypes "github.com/ethereum/go-ethereum/core/types"
)

type ISender interface {
	Send(ctx context.Context)
}

type IReceiver interface {
	Subscribe(ctx context.Context, msgch chan<- *ethTypes.Header, startHeight uint64) (errch <-chan error)
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
