package ethereum

import (
	"crypto/ecdsa"
	"io"
	"os"

	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
)

func SignEthMessage(hashString string) string {
	hash := common.HexToHash(hashString)

	skey := SKey()

	sign, err := crypto.Sign(hash.Bytes(), skey)
	if err != nil {
		panic(err)
	}
	return hexutil.Encode(sign)
}

func SKey() *ecdsa.PrivateKey {
	ksFile, err := os.Open("/home/sheldor/.ethereum/keystore/UTC--2024-01-23T08-48-53.260297099Z--02de27c3f07f4f66a8cfb1ade766a4052f3c9b55")
	if err != nil {
		panic(err)
	}

	byteVal, err := io.ReadAll(ksFile)
	if err != nil {
		panic(err)
	}
	ks, err := keystore.DecryptKey(byteVal, "hello")
	if err != nil {
		panic(err)
	}
	return ks.PrivateKey
}
