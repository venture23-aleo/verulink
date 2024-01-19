package chain

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"
)

type IClient interface {
	Name() string
	FeedPacket(ctx context.Context, ch chan<- *Packet)
}

type NetworkAddress struct {
	ChainID uint64
	Address string
}

func (n NetworkAddress) String() string {
	return fmt.Sprint(n.ChainID, n.Address)
}

type Message struct {
	DestTokenAddress string
	SenderAddress    string
	Amount           *big.Int
	ReceiverAddress  string
}

func (m Message) String() string {
	return fmt.Sprint(m.DestTokenAddress, m.SenderAddress, m.Amount, m.ReceiverAddress)
}

type Packet struct {
	Version     uint64
	Source      NetworkAddress
	Destination NetworkAddress
	Sequence    uint64
	Message     Message
	Height      uint64
}

func (p *Packet) GetSha256Hash() string {
	s := fmt.Sprint(p.Version, p.Source, p.Destination, p.Sequence, p.Message, p.Height)
	h := sha256.New()
	h.Write([]byte(s))
	b := h.Sum(nil)
	return hex.EncodeToString(b)
}

type ScreenedPacket struct {
	Packet  *Packet
	IsWhite bool
}

type QueuedMessage struct {
	RetryCount int8 // balance, network timeout,
	Message    *Packet
}
