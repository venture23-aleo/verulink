package main

import (
	"encoding/json"
	"math/big"
)

type ChainConfig struct {
	Name           string // chain id number
	NetworkAddress string // just like the btp address represents the source 
	RelayWallet    CommonWallet
	Opts           json.RawMessage
	NodeUrl        string
	DstAddress     []string // what about multiple destination feature. It is included to track the event logs corresponding to the destination address can be get from other function calls
	StartHeight    big.Int
}

// Node specific Receivers and Senders and their network client
type Receiver struct {
	Src    string
	Dst    string
	Client Client
}

type Sender struct {
	W      CommonWallet
	Src    string
	Dst    string
	Client Client
}

type Packet struct {
	Version     uint64
	Destination string  // btp://<chainid>/<contractaddress>
	Source      string
	Sequence    big.Int
	Message     []byte
	Height      string
	Nonce       []byte
}

// listens to the source chain for any messages
func (r *Receiver) Subscribe() *Packet {
	return &Packet{}
}

func NewReceiver(src string, dst []string, nodeAddress string) *Receiver { return nil }

// sends the message to the destination chain as per the destination address in the message
func (s *Sender) Send(packet *Packet) error { return nil }

func NewSender(src, dst, nodeAddress string, wallet CommonWallet) *Sender { return nil }

var (
	Senders   map[string]func(src, dst, nodeAddress string, wallet CommonWallet) *Sender
	Receivers map[string]func(src string, dst []string, nodeAddress string) *Receiver
)

type Relays struct {
	Src *Receiver
	Dst []*Sender
}

func (c *ChainConfig) relays() []*Relays {
	var relays []*Relays
	var receiver *Receiver
	Receivers[c.NetworkAddress] = NewReceiver
	receiver = Receivers[c.NetworkAddress](c.NetworkAddress, c.DstAddress, c.NodeUrl)

	var sender []*Sender
	for _, s := range c.DstAddress {
		Senders[s] = NewSender
		sender = append(sender, Senders[s](c.NetworkAddress, s, c.NodeUrl, c.RelayWallet))
	}

	return append(relays, &Relays{
		Src: receiver,
		Dst: sender,
	})
}

type Client struct{}

type CommonWallet struct{}

func main() {

	config := &ChainConfig{}

	relays := config.relays()

	rch := make(chan Relays, len(relays))
	packetCh := make(chan *Packet)

	for _, relay := range relays {
		rch <- *relay
	}

	for {
		select {
		case r := <-rch:
			var packet *Packet
			go func(relay Relays) {
				packet = relay.Src.Subscribe()
				if packet != nil {
					packetCh <- packet
				}

				for {
					select {
					case packet := <-packetCh:
						err := relay.Dst[0].Send(packet) // filter out the destination according to the destination in the packet
						if err != nil {
							return
						}
					default:
						continue
					}
				}
			}(r)
		default:
			continue
		}
	}
}
