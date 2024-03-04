package ethereum

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/attestor/e2etest/common"
)

func TestSendEther(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "ethereum",
		NodeUrl:                     "https://endpoints.omniatech.io/v1/eth/sepolia/public",
		BridgeContractAddress:       "0xC89f5074765Ac2aF3E3b0D9C9fc6079895F02193",
		TokenServiceContractAddress: "0xFEac0FD32367da944498b39f3D1EbD64cC88E13c",
		WalletPath:                  "/home/sheldor/.ethereum/keystore/UTC--2024-01-18T08-23-57.207701022Z--06f1153169c8909a8f3761da4e79274f712328c4",
	})
	err := client.(*Client).TransferEther(context.Background())
	assert.Nil(t, err)
}
