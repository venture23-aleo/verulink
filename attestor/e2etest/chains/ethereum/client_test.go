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
		BridgeContractAddress:       "0xC89f5074765Ac2aF3E3b0D9C9fc6079895F02193",
		TokenServiceContractAddress: "0xFEac0FD32367da944498b39f3D1EbD64cC88E13c",
		WalletPath:                  "/home/sheldor/.ethereum/keystore/UTC--2024-01-18T08-23-57.207701022Z--06f1153169c8909a8f3761da4e79274f712328c4",
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
	err := client.MintUSDC(context.Background(), ethCommon.HexToAddress("0x06f1153169c8909a8f3761da4e79274f712328c4"), value)
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
		BridgeContractAddress:       "0xC89f5074765Ac2aF3E3b0D9C9fc6079895F02193",
		TokenServiceContractAddress: "0xFEac0FD32367da944498b39f3D1EbD64cC88E13c",
		WalletPath:                  "/home/sheldor/.ethereum/keystore/UTC--2024-01-18T08-23-57.207701022Z--06f1153169c8909a8f3761da4e79274f712328c4",
		USDCContractAddress:         "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79",
	})

	value := new(big.Int)
	value, ok := value.SetString("100000000000000000", 10)
	assert.True(t, ok)

	err := client.TransferUSDC(context.Background(), value, "aleo1n0e4f57rlgg7sl2f0sm0xha2557hc8ecw4zst93768qeggdzxgrqcs0vc6")
	assert.NoError(t, err)
}

func TestSequence(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "ethereum",
		NodeUrl:                     "https://endpoints.omniatech.io/v1/eth/sepolia/public",
		BridgeContractAddress:       "0xC89f5074765Ac2aF3E3b0D9C9fc6079895F02193",
		TokenServiceContractAddress: "0xFEac0FD32367da944498b39f3D1EbD64cC88E13c",
		WalletPath:                  "/home/sheldor/.ethereum/keystore/UTC--2024-01-18T08-23-57.207701022Z--06f1153169c8909a8f3761da4e79274f712328c4",
		USDCContractAddress:         "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79",
	})

	sequence, err := client.GetLatestSequenceNumber(context.Background())
	assert.NoError(t, err)
	assert.NotEqual(t, uint64(0), sequence)
}
