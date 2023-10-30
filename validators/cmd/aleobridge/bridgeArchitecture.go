package main

import (
	"encoding/json"
	"fmt"
	"math/big"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/aleo"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

type ChainConfig struct {
	Name           string // chain id number
	NetworkAddress string // just like the btp address represents the source
	RelayWallet    common.Wallet
	Opts           json.RawMessage
	NodeUrl        string
	DstAddress     []string // what about multiple destination feature. It is included to track the event logs corresponding to the destination address can be get from other function calls
	StartHeight    big.Int
}

// Node specific Receivers and Senders and their network client
type Packet struct {
	Version     uint64
	Destination string // btp://<chainid>/<contractaddress>
	Source      string
	Sequence    big.Int
	Message     []byte
	Height      string
	Nonce       []byte
}

// listens to the source chain for any messages
func (r *Receiver) Subscribe() {
	// returns packet
}

func NewReceiver(src string, dst []string, nodeAddress string) chain.IReceiver { return nil }

// sends the message to the destination chain as per the destination address in the message
func NewSender(src, dst, nodeAddress string, wallet common.Wallet) chain.ISender { return nil }

type Relays struct {
	Src chain.IReceiver
	Dst chain.ISender
}

func (c *ChainConfig) relays() []*Relays {
	var relays []*Relays
	var receiver chain.IReceiver
	Receivers[c.NetworkAddress] = NewReceiver
	receiver = Receivers[c.NetworkAddress](c.NetworkAddress, []string{c.NetworkAddress}, c.NodeUrl)

	// after we have a receiver, we will query the smartcontract for the destination addresses of the respective chains and construct the senders. 

	var sender chain.ISender
	
	Senders[c.NetworkAddress] = aleo.NewSender
	sender = Senders[c.NetworkAddress](c.NetworkAddress, c.NetworkAddress, c.NodeUrl, c.RelayWallet)

	return append(relays, &Relays{
		Src: receiver,
		Dst: sender,
	})
}

type CommonWallet struct{}

func mains() {

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
				relay.Src.Subscribe()
				if packet != nil {
					packetCh <- packet
				}

				for {
					select {
					case packet := <-packetCh:
						fmt.Println(packet)
						var err error
						relay.Dst.Send() // filter out the destination according to the destination in the packet
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
