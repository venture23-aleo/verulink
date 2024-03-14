package aleo

import (
	"context"
	"fmt"
	"testing"

	"github.com/venture23-aleo/attestor/e2etest/common"
)

func TestGetLatestSeqNumber(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "aleo",
		TokenServiceContractAddress: "token_service_v0002.aleo",
		USDCContractAddress:         "wusdc_token_v0002.aleo",
		BridgeContractAddress:       "token_bridge_v0002.aleo",
		NodeUrl:                     "https://api.explorer.aleo.org/v1|testnet3",
		WalletPath:                  "APrivateKey1zkpAypsxK9kpYJ8QetRAC3sXRZTSoJXYZCEBzywnHNTmmy5",
		WalletAddress:               "wallet_address",
	})
	sequence := client.GetLatestSequenceNumber(context.Background())
	fmt.Println(sequence)
}
