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
		NodeUrl:                     "wss://eth-sepolia.g.alchemy.com/v2/P_VAeggfVcHemP-tZ7wLQNIrWS6xaWvK",
		BridgeContractAddress:       "0x302f22Ce7bAb6bf5aEFe6FFBa285E844c7F38EA6",
		TokenServiceContractAddress: "0x40ba26EA0f0dE70780A151EAF3F47501e5Cd522A",
		WalletPath:                  "../../testSuite/UTC--2024-07-09T05-45-45.482980559Z--2ca02613ce51b3ed6930e89c63c66219f8e41121",
		USDCContractAddress:         "0x532842De9470816Cf7cc7Cee2d15f19593fBaf64",
	})
	err := client.TransferEther(context.Background())
	assert.Nil(t, err)
}

func TestMintUSDC(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "base",
		NodeUrl:                     "wss://base-sepolia-rpc.publicnode.com",
		BridgeContractAddress:       "0x5410567256E7187b0a6A3C67E240A85d063C3aF5",
		TokenServiceContractAddress: "0x0c1F973927B2D1403727977E8b3Da8A42d640AC0",
		WalletPath:                  "../../testSuite/UTC--2024-07-09T05-45-45.482980559Z--2ca02613ce51b3ed6930e89c63c66219f8e41121",
		USDCContractAddress:         "0x555eC249d1eB0db553AE8df14f4baE287F9CE62a",
	})

	value := new(big.Int)
	value, ok := value.SetString("100000000000000000000", 10)
	assert.True(t, ok)
	err := client.MintUSDC(context.Background(), ethCommon.HexToAddress("0x2cA02613Ce51b3eD6930E89C63c66219f8E41121"), value, "84532")
	assert.NoError(t, err)
}

func TestApproveUSDC(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "base",
		NodeUrl:                     "wss://base-sepolia-rpc.publicnode.com",
		BridgeContractAddress:       "0x5410567256E7187b0a6A3C67E240A85d063C3aF5",
		TokenServiceContractAddress: "0x0c1F973927B2D1403727977E8b3Da8A42d640AC0",
		WalletPath:                  "../../testSuite/UTC--2024-07-09T05-45-45.482980559Z--2ca02613ce51b3ed6930e89c63c66219f8e41121",
		USDCContractAddress:         "0x555eC249d1eB0db553AE8df14f4baE287F9CE62a",
	})
	value := new(big.Int)
	value, ok := value.SetString("10000000000000000000", 10) // 10 USDC
	assert.True(t, ok)
	err := client.ApproveUSDC(context.Background(), value, "84532")
	assert.NoError(t, err)
}

func TestTransferUSDC(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "base",
		NodeUrl:                     "wss://base-sepolia-rpc.publicnode.com",
		BridgeContractAddress:       "0x5410567256E7187b0a6A3C67E240A85d063C3aF5",
		TokenServiceContractAddress: "0x0c1F973927B2D1403727977E8b3Da8A42d640AC0",
		WalletPath:                  "../../testSuite/UTC--2024-07-09T05-45-45.482980559Z--2ca02613ce51b3ed6930e89c63c66219f8e41121",
		USDCContractAddress:         "0x555eC249d1eB0db553AE8df14f4baE287F9CE62a",
	})

	value := new(big.Int)
	value, ok := value.SetString("5000000000000000000", 10) // 5 USDC
	assert.True(t, ok)

	err := client.TransferUSDC(context.Background(), value, "aleo1v7nr80exf6p2709py6xf692v9f69l5cm230w23tz2p9fhx954qpq7cm7p4", "84532")
	assert.NoError(t, err)
}
// got error in transfer -> 0x2dbf87d19074bb4d00955441087127109539f958a6c04dfa420399b8b8a39c6d
func TestSequence(t *testing.T) {
	client := NewClient(&common.ChainConfig{
		Name:                        "base",
		NodeUrl:                     "wss://base-sepolia-rpc.publicnode.com",
		BridgeContractAddress:       "0x5410567256E7187b0a6A3C67E240A85d063C3aF5",
		TokenServiceContractAddress: "0x0c1F973927B2D1403727977E8b3Da8A42d640AC0",
		WalletPath:                  "../../testSuite/UTC--2024-07-09T05-45-45.482980559Z--2ca02613ce51b3ed6930e89c63c66219f8e41121",
		USDCContractAddress:         "0x555eC249d1eB0db553AE8df14f4baE287F9CE62a",
	})

	sequence, err := client.GetLatestSequenceNumber(context.Background())
	assert.NoError(t, err)
	assert.NotEqual(t, uint64(0), sequence)
}
