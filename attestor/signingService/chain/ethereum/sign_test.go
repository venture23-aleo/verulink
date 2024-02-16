package ethereum

import (
	"os"
	"testing"

	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/config"

	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/stretchr/testify/assert"
)

func TestValidateKeys(t *testing.T) {
	key, err := os.ReadFile("/home/sheldor/.ethereum/keystore/UTC--2024-01-23T08-48-53.260297099Z--02de27c3f07f4f66a8cfb1ade766a4052f3c9b55")
	assert.NoError(t, err)
	pvtKey, err := keystore.DecryptKey(key, "hello")
	assert.NoError(t, err)

	privKey := crypto.FromECDSA(pvtKey.PrivateKey)

	privateKeyString := hexutil.Encode(privKey)

	err = SetUpPrivateKey(&config.KeyPair{
		PrivateKey: privateKeyString,
		PublicKey:  "0x02de27c3f07f4f66a8cfb1ade766a4052f3c9b55",
	})
	assert.NoError(t, err)
}
