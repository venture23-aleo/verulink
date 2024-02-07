package chain

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"

	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/config"
)

type ClientFunc func(cfg *config.ChainConfig, m map[string]*big.Int) IClient
type HashFunc func(sp *ScreenedPacket) string

type IClient interface {
	Name() string
	FeedPacket(ctx context.Context, ch chan<- *Packet)
	GetMissedPacket(
		ctx context.Context, missedPkt *MissedPacket) (
		*Packet, error)
}

type NetworkAddress struct {
	ChainID *big.Int `json:"chain_id"`
	Address string   `json:"address"`
}

func (n NetworkAddress) String() string {
	return fmt.Sprint(n.ChainID, n.Address)
}

type Message struct {
	DestTokenAddress string   `json:"dest_token_address"`
	SenderAddress    string   `json:"sender_address"`
	Amount           *big.Int `json:"amount"`
	ReceiverAddress  string   `json:"receiver_address"`
}

func (m Message) String() string {
	return fmt.Sprint(m.DestTokenAddress, m.SenderAddress, m.Amount, m.ReceiverAddress)
}

type Packet struct {
	Version     uint8          `json:"version"`
	Source      NetworkAddress `json:"source"`
	Destination NetworkAddress `json:"destination"`
	Sequence    uint64         `json:"sequence"`
	Message     Message        `json:"message"`
	Height      uint64         `json:"height"`
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
	Packet  *Packet `json:"packet"`
	IsWhite bool    `json:"is_white"`
}

type MissedPacket struct {
	TargetChainID *big.Int `json:"target_chain_id"`
	SourceChainID *big.Int `json:"source_chain_id"`
	SeqNum        uint64   `json:"seq_num"`
	Height        uint64   `json:"height"`
	TxnID         string   `json:"txn_id"`
	IsLast        bool     `json:"-"`
}
