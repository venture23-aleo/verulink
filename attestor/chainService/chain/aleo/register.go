package aleo

import "github.com/venture23-aleo/attestor/chainService/relay"

func init() {
	relay.RegisteredClients["aleo"] = NewClient
}
