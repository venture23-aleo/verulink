package ethereum

import (
	"crypto/ecdsa"
	"io"
	"os"

	"github.com/ethereum/go-ethereum/accounts/keystore"
)

type wallet struct {
	PrivateKey string `json:"private_key"`
	KSPath     string `json:"ks_path"`
	ViewKey    string `json:"view_key"`
	CoinType   string `json:"coin_type"`
}

func (w *wallet) Sign(data []byte) ([]byte, error) {
	return nil, nil
}

func (w *wallet) PubKey() string {
	return ""
}

func (w *wallet) SKey() *ecdsa.PrivateKey {
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
