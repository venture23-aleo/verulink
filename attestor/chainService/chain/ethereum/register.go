package ethereum

import (
	"github.com/venture23-aleo/attestor/chainService/chain"
	"github.com/venture23-aleo/attestor/chainService/relay"
)

var completedCh chan *chain.Packet
var retryCh chan *chain.Packet

func init() {
	relay.RegisteredClients["ethereum"] = NewClient
	relay.RegisteredHashers["ethereum"] = hash
	completedCh = make(chan *chain.Packet) // todo: make proper bufferred channel
	relay.RegisteredCompleteChannels["ethereum"] = completedCh
	retryCh = make(chan *chain.Packet) // todo: make proper bufferred channel
	relay.RegisteredRetryChannels["ethereum"] = retryCh
}
