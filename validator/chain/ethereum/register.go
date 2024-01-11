package ethereum

import "github.com/venture23-aleo/validator/relay"

func init() {
	relay.RegisteredClients["ethereum"] = NewClient
}
