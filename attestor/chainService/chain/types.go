package chain

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"

	"github.com/venture23-aleo/attestor/chainService/config"
)

type ClientFunc func(cfg *config.ChainConfig, m map[string]*big.Int) IClient
type HashFunc func(sp *ScreenedPacket) string

type Getter interface {
	GetMissedPacket(
		ctx context.Context, missedPkt *MissedPacket) (
		*Packet, error)
}

type IClient interface {
	Name() string
	FeedPacket(ctx context.Context, ch chan<- *Packet)
	Getter
}

type NetworkAddress struct {
	ChainID *big.Int
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
	Version     uint8
	Source      NetworkAddress
	Destination NetworkAddress
	Sequence    uint64
	Message     Message
	Height      uint64
	// isMissed specify that this packet was somehow missed and db-service administrator has
	// requested attestors to re-process it
	isMissed bool
}

func (p *Packet) IsMissed() bool {
	return p.isMissed
}

func (p *Packet) SetMissed(isMissed bool) {
	p.isMissed = isMissed
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

type MissedPacket struct {
	TargetChainID *big.Int
	SourceChainID *big.Int
	SeqNum        uint64
	Height        uint64
	TxnID         string
}
