package ethereum

import (
	"crypto/ecdsa"
	"encoding/hex"
	"fmt"
	"strings"

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
	privKey := strings.Replace(keyPair.PrivateKey, "0x", "", 1) // remove 0x

	privateKey, err := crypto.HexToECDSA(privKey)
	if err != nil {
		return err
	}
	err = validateKey(privateKey, keyPair.PublicKey)
	if err != nil {
		return err
	}

	pKey = privateKey
	return nil
}

func validateKey(privateKey *ecdsa.PrivateKey, publicKey string) error {
	pubKey := hex.EncodeToString(crypto.FromECDSAPub(&privateKey.PublicKey))
	pubKey = strings.ToLower(pubKey)
	if pubKey != strings.ToLower(publicKey) {
		return fmt.Errorf("private key cannot derive the give public key address")
	}
	return nil
}
