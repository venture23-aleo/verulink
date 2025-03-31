package ethereum

import (
	"crypto/ecdsa"
	"testing"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/venture23-aleo/verulink/attestor/signingService/config"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidateKeys(t *testing.T) {

	t.Run("valid key should return nil error", func(t *testing.T) {
		t.Cleanup(func() {
			pkeyMap = nil
		})
		privateKey := "a0e60c11e94f0aec4a9a363b86fa30945eac1750914ec6f878a8c9be438efb48"
		walletAddr := "0x5dc561633f195d44a530cdf0f288a409286797ff"
		pKey, err := crypto.HexToECDSA(privateKey)
		require.NoError(t, err)

		err = validateKey(pKey, walletAddr)
		require.NoError(t, err)
	})

	t.Run("invalid key should return error", func(t *testing.T) {
		t.Cleanup(func() {
			pkeyMap = nil
		})
		privateKey := "a0e60c11e94f0aec4a9a363b86fa30945eac1750914ec6f878a8c9be438efb48"
		walletAddr := "0x5dc561633f195d44a530cdf0f288a409286797fe"
		pKey, err := crypto.HexToECDSA(privateKey)
		require.NoError(t, err)

		err = validateKey(pKey, walletAddr)
		require.Error(t, err)
	})
}

func TestSetUpPrivateKey(t *testing.T) {
	t.Run("passing valid key pair should set private key", func(t *testing.T) {
		pkeyMap = make(map[string]*ecdsa.PrivateKey) // reintializing this as previous test made this nil
		t.Cleanup(func() {
			pkeyMap = nil
		})

		kp := &config.KeyPair{
			PrivateKey:    "a0e60c11e94f0aec4a9a363b86fa30945eac1750914ec6f878a8c9be438efb48",
			WalletAddress: "0x5dc561633f195d44a530cdf0f288a409286797ff",
			ChainType:     "ethereum",
		}

		expectedPKey, err := crypto.HexToECDSA(kp.PrivateKey)
		require.NoError(t, err)

		err = SetUpPrivateKey(kp, "ethereum")
		require.NoError(t, err)

		assert.Equal(t, expectedPKey, pkeyMap["ethereum"])
	})

	t.Run("passing invalid key pair should not set private key", func(t *testing.T) {
		t.Cleanup(func() {
			pkeyMap = nil
		})

		kp := &config.KeyPair{
			PrivateKey:    "a0e60c11e94f0aec4a9a363b86fa30945eac1750914ec6f878a8c9be438efb48",
			WalletAddress: "0x5dc561633f195d44a530cdf0f288a409286797fe",
			ChainType:     "ethereum",
		}

		err := SetUpPrivateKey(kp, "ethereum")
		require.Error(t, err)

		require.Nil(t, pkeyMap["ethereum"]) // TODO : do same for base wallet
	})
}
