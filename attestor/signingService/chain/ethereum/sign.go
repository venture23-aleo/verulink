package ethereum

import (
	"crypto/ecdsa"
	"fmt"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/venture23-aleo/verulink/attestor/signingService/config"
)

var pKey *ecdsa.PrivateKey // TODO : remove this

var pkeyMap map[string]*ecdsa.PrivateKey

// sign returns the ecdsa signature of the attestors on the input hash string
func sign(hashString string, chainName string) (string, error) {
	hash := common.HexToHash(hashString)

	ppKey := pkeyMap[chainName]
	b, err := crypto.Sign(hash.Bytes(), ppKey)
	if err != nil {
		return "", err
	}

	return "0x" + common.Bytes2Hex(b), nil
}

// SetUpPrivateKey accepts the private-key address pair and validates the private key to set the pKey
func SetUpPrivateKey(keyPair *config.KeyPair, chainName string) error {
	privKey := strings.Replace(keyPair.PrivateKey, "0x", "", 1) // remove 0x

	privateKey, err := crypto.HexToECDSA(privKey)
	if err != nil {
		return err
	}

	err = validateKey(privateKey, keyPair.WalletAddress)
	if err != nil {
		return err
	}

	// pKey = privateKey // TODO
    pkeyMap = make(map[string]*ecdsa.PrivateKey)
	pkeyMap[chainName] = privateKey
	return nil
}

// validateKey validates the private key by deriving the address from it and comparing it to the provided
// address
func validateKey(privateKey *ecdsa.PrivateKey, addr string) error {
	calculatedAddr := crypto.PubkeyToAddress(privateKey.PublicKey)
	if !strings.EqualFold(calculatedAddr.Hex(), addr) {
		return fmt.Errorf("private key cannot derive given wallet address")
	}
	return nil
}
