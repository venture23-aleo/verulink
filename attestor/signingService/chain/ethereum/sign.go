package ethereum

import (
	"crypto/ecdsa"
	"os"

	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

var pKey *ecdsa.PrivateKey

func sign(hashString string) (string, error) {
	hash := common.HexToHash(hashString)
	b, err := crypto.Sign(hash.Bytes(), pKey)
	if err != nil {
		return "", err
	}

	return "0x" + common.Bytes2Hex(b), nil
}

func SetUpPrivateKey(keyPath, decryptKey string) error {
	b, err := os.ReadFile(keyPath)
	if err != nil {
		return err
	}

	ks, err := keystore.DecryptKey(b, decryptKey)
	if err != nil {
		return err
	}
	pKey = ks.PrivateKey
	return nil

}
