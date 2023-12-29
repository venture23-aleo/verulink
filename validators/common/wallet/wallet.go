package common

type Wallet interface {
	Sign(data []byte) ([]byte, error)
	PubKey() string
}

func IsValidPubKey(pubKey string) bool {
	return false
}
