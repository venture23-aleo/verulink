package aleo

import "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"

func init() {
	relay.RegisteredReceiver["aleo"] = NewReceiver
	relay.RegisteredSender["aleo"] = NewSender
}
