package aleo

import (
	"context"
	"os/exec"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/verulink/attestor/signingService/config"
)

func TestValidateAleoPrivateKey(t *testing.T) {
	originalExecCommand := execCommand
	defer func() { execCommand = originalExecCommand }()

	t.Run("valid key pair should work", func(t *testing.T) {
		execCommand = func(ctx context.Context, name string, args ...string) *exec.Cmd {
			// Create a dummy command that echoes the expected public key
			return fakeExecCommand(`aleo1trm2ez57pvqkrw9slt5u77l7dr0ql2c4xfkz58qw3gavup5t0gyq8tsgrk`)
		}
		t.Cleanup(func() {
			sKey = ""
		})

		privateKey := "APrivateKey1zkp5TBwT1HrfGvHtBYqDnA2rk6Qv3Kk9eTeW8ZpaPTpCiFq"
		publicKey := "aleo1trm2ez57pvqkrw9slt5u77l7dr0ql2c4xfkz58qw3gavup5t0gyq8tsgrk"
		err := validateAleoPrivateKey(privateKey, publicKey)
		assert.NoError(t, err)
	})

	t.Run("invalid key pair should not work", func(t *testing.T) {
		execCommand = func(ctx context.Context, name string, args ...string) *exec.Cmd {
			return fakeExecCommand(`aleo1DIFFERENTkey00000000000000000000000000000000000000000`)
		}
		t.Cleanup(func() {
			sKey = ""
		})
		privateKey := "APrivateKey1zkp5TBwT1HrfGvHtBYqDnA2rk6Qv3Kk9eTeW8ZpaPTpCiFq"
		publicKey := "aleo1nuhw2452a9x2hld3umwre4n0cz38zea0uf2365crwyhl5m74myyshlcqgr"
		err := validateAleoPrivateKey(privateKey, publicKey)
		assert.Error(t, err)
	})
}

func TestSetUpPrivateKey(t *testing.T) {
	originalExecCommand := execCommand
	defer func() { execCommand = originalExecCommand }()
	t.Run("passing valid key pair should set private key", func(t *testing.T) {
		execCommand = func(ctx context.Context, name string, args ...string) *exec.Cmd {
			return fakeExecCommand(`aleo1trm2ez57pvqkrw9slt5u77l7dr0ql2c4xfkz58qw3gavup5t0gyq8tsgrk`)
		}
		t.Cleanup(func() {
			sKey = ""
		})

		kp := &config.KeyPair{
			PrivateKey:    "APrivateKey1zkp5TBwT1HrfGvHtBYqDnA2rk6Qv3Kk9eTeW8ZpaPTpCiFq",
			WalletAddress: "aleo1trm2ez57pvqkrw9slt5u77l7dr0ql2c4xfkz58qw3gavup5t0gyq8tsgrk",
		}
		err := SetUpPrivateKey(kp)
		assert.NoError(t, err)
		assert.Equal(t, kp.PrivateKey, sKey)
	})

	t.Run("passing invalid key pair should not set private key", func(t *testing.T) {
		execCommand = func(ctx context.Context, name string, args ...string) *exec.Cmd {
			return fakeExecCommand(`aleo1DIFFERENTkey00000000000000000000000000000000000000000`)
		}
		t.Cleanup(func() {
			sKey = ""
		})
		kp := &config.KeyPair{
			PrivateKey:    "APrivateKey1zkp5TBwT1HrfGvHtBYqDnA2rk6Qv3Kk9eTeW8ZpaPTpCiFq",
			WalletAddress: "aleo1nuhw2452a9x2hld3umwre4n0cz38zea0uf2365crwyhl5m74myyshlcqgr",
		}
		err := SetUpPrivateKey(kp)
		assert.Error(t, err)
		assert.Equal(t, "", sKey)
	})
}

func fakeExecCommand(mockOutput string) *exec.Cmd {
	return exec.Command("/bin/sh", "-c", "printf '"+mockOutput+"'")
}
