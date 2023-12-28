package aleo

import (
	"context"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
)

func TestGetPacket(t *testing.T) {
	cfg := &relay.ChainConfig{
		ChainID:        2,
		NodeUrl:        "http://52.91.48.169|testnet3",
		BridgeContract: "bridge.aleo",
		StartHeight:    1,
		WalletPath:     "/home/sheldor/github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/aleo_wallet.json",
	}
	client := NewClient(cfg)

	mappingValue, err := client.(*Client).GetPktWithSeq(context.Background(), 1, 1)
	assert.Nil(t, err)
	fmt.Println(mappingValue.Message.SenderAddress)
}
