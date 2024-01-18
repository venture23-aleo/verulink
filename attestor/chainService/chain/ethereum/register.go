package ethereum

import "github.com/venture23-aleo/attestor/chainService/relay"

func init() {
	relay.RegisteredClients["ethereum"] = NewClient
}
