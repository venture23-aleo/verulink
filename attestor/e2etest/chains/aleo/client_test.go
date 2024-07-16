package aleo

import (
	"context"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/attestor/e2etest/common"
)

func TestGetLatestSeqNumber(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "aleo",
		TokenServiceContractAddress: "token_service_v0001.aleo",
		USDCContractAddress:         "wusdc_token_v0001_1.aleo",
		BridgeContractAddress:       "token_bridge_v0001.aleo",
		NodeUrl:                     "https://api.explorer.aleo.org/v1|testnet",
		WalletPath:                  "APrivateKey1zkpAypsxK9kpYJ8QetRAC3sXRZTSoJXYZCEBzywnHNTmmy5",
		WalletAddress:               "wallet_address",
	})
	sequence := client.GetLatestSequenceNumber(context.Background())
	fmt.Println(sequence)
}

func TestTransferUSDC(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "aleo",
		TokenServiceContractAddress: "token_service_v0001.aleo",
		USDCContractAddress:         "wusdc_token_v0001_1.aleo",
		BridgeContractAddress:       "token_bridge_v0001.aleo",
		NodeUrl:                     "https://api.explorer.aleo.org/v1|testnet",
		WalletPath:                  "APrivateKey1zkpAypsxK9kpYJ8QetRAC3sXRZTSoJXYZCEBzywnHNTmmy5",
		WalletAddress:               "wallet_address",
	})
	err := client.TransferUSDC(context.Background())
	assert.NoError(t, err)
}

// APrivateKey1zkpAypsxK9kpYJ8QetRAC3sXRZTSoJXYZCEBzywnHNTmmy5
