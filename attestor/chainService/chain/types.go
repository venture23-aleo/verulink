package chain

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math/big"

	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/config"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/metrics"
)

type ClientFunc func(cfg *config.ChainConfig) IClient
type HashFunc func(sp *ScreenedPacket) string

type IClient interface {
	// Name gives the name of the client
	Name() string
	// FeedPacket fetches the packet from the source chain and sends it to the channel `ch`
	FeedPacket(ctx context.Context, ch chan<- *Packet)
	// GetMissedPacket queries the db-service for information about the packet the attestor
	// node has to reverify and resign
	GetMissedPacket(
		ctx context.Context, missedPkt *MissedPacket) (
		*Packet, error)
	SetMetrics(metrics *metrics.PrometheusMetrics)
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

// Packet denotes the common structure for all the Outgoing and Incoming packets in the bridge
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

// ScreenedPacket is a struct to denote if a packet has been flagged by the wallet screening
// service; IsWhite: true denotes the packet has been white flagged
type ScreenedPacket struct {
	Packet  *Packet `json:"packet"`
	IsWhite bool    `json:"is_white"`
}

// MissedPacket denotes the information about a packet that db-service administrator has requested
// for the attestors to re-process
type MissedPacket struct {
	TargetChainID *big.Int `json:"target_chain_id"`
	SourceChainID *big.Int `json:"source_chain_id"`
	SeqNum        uint64   `json:"seq_num"`
	Height        uint64   `json:"height"`
	TxnID         string   `json:"txn_id"`
}
