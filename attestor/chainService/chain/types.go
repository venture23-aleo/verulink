package chain

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"

	"github.com/venture23-aleo/verulink/attestor/chainService/config"
	"github.com/venture23-aleo/verulink/attestor/chainService/logger"
	"github.com/venture23-aleo/verulink/attestor/chainService/metrics"
	"go.uber.org/zap"
)

type (
	ClientFunc func(cfg *config.ChainConfig) IClient
	HashFunc   func(sp *ScreenedPacket) string
)

type IClient interface {
	// Name gives the name of the client
	Name() string
	// FeedPacket fetches the packet from the source chain and sends it to the channel `ch`
	FeedPacket(ctx context.Context, ch chan<- *Packet, compCh chan *Packet, retryCh chan *Packet)
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
	// Instant specify that this packet is delivered instantly. This flag is set true based on
	// version of the packet
	Instant bool `json:"instant"`
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

func (p *Packet) SetInstant(isInstant bool) {
	p.Instant = isInstant
}

func (p *Packet) GetInstant() bool {
	return p.Instant
}

func (p *Packet) GetSha256Hash() string {
	s := fmt.Sprintf("%d-%s-%s-%d-%s-%d", p.Version, p.Source, p.Destination, p.Sequence, p.Message, p.Height)
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
	TargetChainID *big.Int `json:"destChainId"`
	SourceChainID *big.Int `json:"sourceChainId"`
	SeqNum        uint64   `json:"sequence"`
	Height        uint64   `json:"height"`
	TxnID         string   `json:"transactionHash"`
}

// MissedPacketDetails represents the structure sent by the db-service during polling.
type MissedPacketDetails struct {
	Data    []*MissedPacket `json:"data"`
	Message string          `json:"message"`
}

// Custom unmarshal function to convert a JSON string into a *big.Int
func (packet *MissedPacket) UnmarshalJSON(data []byte) error {
	mPKt := &struct {
		TargetChainID string `json:"destChainId"`
		SourceChainID string `json:"sourceChainId"`
		SeqNum        uint64 `json:"sequence"`
		Height        uint64 `json:"height"`
		TxnID         string `json:"transactionHash"`
	}{}

	if err := json.Unmarshal(data, &mPKt); err != nil {
		logger.GetLogger().Error("Error while unmarshaling missed packet ", zap.Error(err))
		return err
	}

	packet.TargetChainID, _ = new(big.Int).SetString(mPKt.TargetChainID, 10)

	packet.SourceChainID, _ = new(big.Int).SetString(mPKt.SourceChainID, 10)
	packet.SeqNum = mPKt.SeqNum
	packet.Height = mPKt.Height
	packet.TxnID = mPKt.TxnID
	return nil
}

// CollectorResponse is a struct that represent the response sent by collector on ok
type CollectorResponse struct {
	Message string `json:"message"`
}
