package ethereum

import "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"

func init(){
	relay.RegisteredReceiver["ethereum"] = NewReceiver
	relay.RegisteredSender["ethereum"] = NewSender
}