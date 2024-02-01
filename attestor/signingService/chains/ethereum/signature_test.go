package ethereum

import (
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/assert"
)

func TestSignature(t *testing.T) {
	signature := SignEthMessage("0x01e80e351de9084e68e456b2f9fa18219ffc886f4bfc9e9ad629e5849263bb17")

	finalHash := common.HexToHash("0x01e80e351de9084e68e456b2f9fa18219ffc886f4bfc9e9ad629e5849263bb17")

	signBytes, _ := hexutil.Decode(signature)
	publicKey, err := crypto.Ecrecover(finalHash.Bytes(), signBytes)
	if err != nil {
		panic(err)
	}

	ok := crypto.VerifySignature(publicKey, finalHash.Bytes(), signBytes[:len(signBytes)-1])
	assert.True(t, ok)
}
