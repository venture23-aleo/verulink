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

		require.Nil(t, pkeyMap["ethereum"])
	})
}

func TestSignHash(t *testing.T) {
	t.Run("sign hash", func(t *testing.T) {
		keyDetails := config.KeyPair{
			PrivateKey:    "b570a51f150a0cfb7a39017365e3cdc8da76af1805a5903f4b83e88eabdc9c21",
			WalletAddress: "0x832894550007b560bd35d28ce564c2ccd690318f",
			ChainType:     "evm",
		}
		err := SetUpPrivateKey(&keyDetails, "ethereum")
		require.NoError(t, err)
		sig, err := sign("0x5fed48e10cfa0f4922d33b2e9addfa84155ea79ad1ed84ea97280fdb941da6f4", "ethereum")
		require.NoError(t, err)
		require.Equal(t, "0xcf6708575951fce45d5fab038b65d2adc6ef1f27181e839d72200be13815623d229a5aa6e21003bbccce747bfaee33ff602236f2c15a6a1720f053c958e6e69b1c", sig)
	})
}
