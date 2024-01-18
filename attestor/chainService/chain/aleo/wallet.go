package aleo

type wallet struct {
	PrivateKey string `json:"private_key"`
	PublicKey  string `json:"public_key"`
	ViewKey    string `json:"view_key"`
	CoinType   string `json:"coin_type"`
}

func (w *wallet) Sign(data []byte) ([]byte, error) {
	return nil, nil
}

func (w *wallet) PubKey() string {
	return w.PublicKey
}
