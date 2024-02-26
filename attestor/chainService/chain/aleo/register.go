package aleo

import (
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/relay"
)

var completedCh chan *chain.Packet
var retryCh chan *chain.Packet

func init() {
	relay.RegisteredClients["aleo"] = NewClient
	completedCh = make(chan *chain.Packet)
	relay.RegisteredCompleteChannels["aleo"] = completedCh
	retryCh = make(chan *chain.Packet)
	relay.RegisteredRetryChannels["aleo"] = retryCh
}
