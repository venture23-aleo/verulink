package ethereum

import (
	"crypto/ecdsa"
	"io"
	"os"

	"github.com/ethereum/go-ethereum/accounts/keystore"
)

type EVMWallet struct {
	PrivateKey string `json:"private_key"`
	KSPath     string `json:"ks_path"`
	ViewKey    string `json:"view_key"`
	CoinType   string `json:"coin_type"`
}

func (w *EVMWallet) Sign(data []byte) ([]byte, error) {
	return nil, nil
}

func (w *EVMWallet) PubKey() string {
	return ""
}

func (w *EVMWallet) SKey() *ecdsa.PrivateKey {
	ksFile, err := os.Open(w.KSPath)
	if err != nil {
		return nil
	}

	byteVal, err := io.ReadAll(ksFile)
	if err != nil {
		return nil
	}
	ks, err := keystore.DecryptKey(byteVal, "hello")
	if err != nil {
		return nil
	}
	return ks.PrivateKey
}
