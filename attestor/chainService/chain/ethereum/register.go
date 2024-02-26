package ethereum

import (
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/relay"
)

var completedCh chan *chain.Packet
var retryCh chan *chain.Packet

func init() {
	relay.RegisteredClients["ethereum"] = NewClient
	completedCh = make(chan *chain.Packet)
	relay.RegisteredCompleteChannels["ethereum"] = completedCh
	retryCh = make(chan *chain.Packet)
	relay.RegisteredRetryChannels["ethereum"] = retryCh
}
