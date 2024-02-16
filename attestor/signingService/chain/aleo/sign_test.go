package aleo

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/config"
)

func TestSetupPrivateKey(t *testing.T) {
	t.Run("valid key pair should work", func(t *testing.T) {
		err := SetUpPrivateKey(&config.KeyPair{
			PrivateKey: "APrivateKey1zkp5TBwT1HrfGvHtBYqDnA2rk6Qv3Kk9eTeW8ZpaPTpCiFq",
			PublicKey: "aleo1trm2ez57pvqkrw9slt5u77l7dr0ql2c4xfkz58qw3gavup5t0gyq8tsgrk",
		})
		assert.NoError(t, err)
	})
	t.Run("invalid key pair should no work", func(t *testing.T) {
		err := SetUpPrivateKey(&config.KeyPair{
			PrivateKey: "APrivateKey1zkp5TBwT1HrfGvHtBYqDnA2rk6Qv3Kk9eTeW8ZpaPTpCiFq",
			PublicKey: "aleo1nuhw2452a9x2hld3umwre4n0cz38zea0uf2365crwyhl5m74myyshlcqgr",
		})
		assert.Error(t, err)
	})
}
