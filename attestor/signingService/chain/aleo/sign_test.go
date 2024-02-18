package aleo

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/config"
)

func TestValidateAleoPrivateKey(t *testing.T) {
	t.Run("valid key pair should work", func(t *testing.T) {
		privateKey := "APrivateKey1zkp5TBwT1HrfGvHtBYqDnA2rk6Qv3Kk9eTeW8ZpaPTpCiFq"
		publicKey := "aleo1trm2ez57pvqkrw9slt5u77l7dr0ql2c4xfkz58qw3gavup5t0gyq8tsgrk"
		err := validateAleoPrivateKey(privateKey, publicKey)
		assert.NoError(t, err)
	})

	t.Run("invalid key pair should not work", func(t *testing.T) {
		privateKey := "APrivateKey1zkp5TBwT1HrfGvHtBYqDnA2rk6Qv3Kk9eTeW8ZpaPTpCiFq"
		publicKey := "aleo1nuhw2452a9x2hld3umwre4n0cz38zea0uf2365crwyhl5m74myyshlcqgr"
		err := validateAleoPrivateKey(privateKey, publicKey)
		assert.Error(t, err)
	})
}

func TestSetUpPrivateKey(t *testing.T) {
	t.Run("passing valid key pair should set private key", func(t *testing.T) {
		kp := &config.KeyPair{
			PrivateKey: "APrivateKey1zkp5TBwT1HrfGvHtBYqDnA2rk6Qv3Kk9eTeW8ZpaPTpCiFq",
			PublicKey:  "aleo1trm2ez57pvqkrw9slt5u77l7dr0ql2c4xfkz58qw3gavup5t0gyq8tsgrk",
		}
		err := SetUpPrivateKey(kp)
		assert.NoError(t, err)
		assert.Equal(t, kp.PrivateKey, sKey)
	})

	t.Run("passing invalid key pair should not set private key", func(t *testing.T) {
		kp := &config.KeyPair{
			PrivateKey: "APrivateKey1zkp5TBwT1HrfGvHtBYqDnA2rk6Qv3Kk9eTeW8ZpaPTpCiFq",
			PublicKey:  "aleo1nuhw2452a9x2hld3umwre4n0cz38zea0uf2365crwyhl5m74myyshlcqgr",
		}
		err := SetUpPrivateKey(kp)
		assert.Error(t, err)
		assert.Equal(t, "", sKey)
	})
}
