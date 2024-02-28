package ethereum

import (
	"testing"

	"github.com/ethereum/go-ethereum/crypto"
	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/config"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidateKeys(t *testing.T) {

	t.Run("valid key should return nil error", func(t *testing.T) {
		t.Cleanup(func() {
			pKey = nil
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
			pKey = nil
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
		t.Cleanup(func() {
			pKey = nil
		})

		kp := &config.KeyPair{
			PrivateKey:    "a0e60c11e94f0aec4a9a363b86fa30945eac1750914ec6f878a8c9be438efb48",
			WalletAddress: "0x5dc561633f195d44a530cdf0f288a409286797ff",
		}

		expectedPKey, err := crypto.HexToECDSA(kp.PrivateKey)
		require.NoError(t, err)

		err = SetUpPrivateKey(kp)
		require.NoError(t, err)

		assert.Equal(t, expectedPKey, pKey)
	})

	t.Run("passing invalid key pair should not set private key", func(t *testing.T) {
		t.Cleanup(func() {
			pKey = nil
		})

		kp := &config.KeyPair{
			PrivateKey:    "a0e60c11e94f0aec4a9a363b86fa30945eac1750914ec6f878a8c9be438efb48",
			WalletAddress: "0x5dc561633f195d44a530cdf0f288a409286797fe",
		}

		err := SetUpPrivateKey(kp)
		require.Error(t, err)

		require.Nil(t, pKey)
	})
}
