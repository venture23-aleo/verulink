package ethereum

import (
	"context"
	"math/big"
	"testing"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/attestor/e2etest/common"
)

func TestSendEther(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "ethereum",
		NodeUrl:                     "https://endpoints.omniatech.io/v1/eth/sepolia/public",
		BridgeContractAddress:       "0xB83766b28bE2Cf6Fb28Cd055beFB55fdc68CfC9C",
		TokenServiceContractAddress: "0x5554f1660e1464a86E9155374ea33b0Ab7b890Bd",
		WalletPath:                  "/home/aanya/.ethereum/keystore/UTC--2024-07-09T05-45-45.482980559Z--2ca02613ce51b3ed6930e89c63c66219f8e41121",
	})
	err := client.TransferEther(context.Background())
	assert.Nil(t, err)
}

func TestMintUSDC(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "ethereum",
		NodeUrl:                     "https://endpoints.omniatech.io/v1/eth/sepolia/public",
		BridgeContractAddress:       "0xC89f5074765Ac2aF3E3b0D9C9fc6079895F02193",
		TokenServiceContractAddress: "0xFEac0FD32367da944498b39f3D1EbD64cC88E13c",
		WalletPath:                  "/home/sheldor/.ethereum/keystore/UTC--2024-01-18T08-23-57.207701022Z--06f1153169c8909a8f3761da4e79274f712328c4",
		USDCContractAddress:         "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79",
	})

	value := new(big.Int)
	value, ok := value.SetString("100000000000000000000", 10)
	assert.True(t, ok)
	err := client.MintUSDC(context.Background(), ethCommon.HexToAddress("0x218600eC01a8Fd9Bf9DEc0C91ac2ec480331Bc9B"), value)
	assert.NoError(t, err)
}

func TestApproveUSDC(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "ethereum",
		NodeUrl:                     "https://endpoints.omniatech.io/v1/eth/sepolia/public",
		BridgeContractAddress:       "0xC89f5074765Ac2aF3E3b0D9C9fc6079895F02193",
		TokenServiceContractAddress: "0xFEac0FD32367da944498b39f3D1EbD64cC88E13c",
		WalletPath:                  "/home/sheldor/.ethereum/keystore/UTC--2024-01-18T08-23-57.207701022Z--06f1153169c8909a8f3761da4e79274f712328c4",
		USDCContractAddress:         "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79",
	})
	value := new(big.Int)
	value, ok := value.SetString("10000000000000000000", 10)
	assert.True(t, ok)
	err := client.ApproveUSDC(context.Background(), value)
	assert.NoError(t, err)
}

func TestTransferUSDC(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "ethereum",
		NodeUrl:                     "https://endpoints.omniatech.io/v1/eth/sepolia/public",
		BridgeContractAddress:       "0xB83766b28bE2Cf6Fb28Cd055beFB55fdc68CfC9C",
		TokenServiceContractAddress: "0x5554f1660e1464a86E9155374ea33b0Ab7b890Bd",
		WalletPath:                  "/home/aanya/.ethereum/keystore/UTC--2024-07-09T05-45-45.482980559Z--2ca02613ce51b3ed6930e89c63c66219f8e41121",
		USDCContractAddress:         "0xD99e898842c566be038bf898b3e406f028a031E0",
	})

	value := new(big.Int)
	value, ok := value.SetString("100000000000000000", 10)
	assert.True(t, ok)

	err := client.TransferUSDC(context.Background(), value, "aleo1v7nr80exf6p2709py6xf692v9f69l5cm230w23tz2p9fhx954qpq7cm7p4")
	assert.NoError(t, err)
}

func TestSequence(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "ethereum",
		NodeUrl:                     "https://endpoints.omniatech.io/v1/eth/sepolia/public",
		BridgeContractAddress:       "0xB83766b28bE2Cf6Fb28Cd055beFB55fdc68CfC9C",
		TokenServiceContractAddress: "0x5554f1660e1464a86E9155374ea33b0Ab7b890Bd",
		WalletPath:                  "/home/aanya/.ethereum/keystore/UTC--2024-07-09T05-45-45.482980559Z--2ca02613ce51b3ed6930e89c63c66219f8e41121",
		USDCContractAddress:         "0xD99e898842c566be038bf898b3e406f028a031E0",
	})

	sequence, err := client.GetLatestSequenceNumber(context.Background())
	assert.NoError(t, err)
	assert.NotEqual(t, uint64(0), sequence)
}
