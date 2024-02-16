package ethereum

import (
	"crypto/ecdsa"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/config"
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

func SetUpPrivateKey(keyPair *config.KeyPair) error {
	err := validateKey(keyPair.PrivateKey, keyPair.PublicKey)
	if err != nil {
		return err
	}

	privateKey, err := crypto.HexToECDSA(keyPair.PrivateKey)
	if err != nil {
		return err
	}
	pKey = privateKey
	return nil
}

func validateKey(privateKey, publicKey string) error {
	return nil
}
