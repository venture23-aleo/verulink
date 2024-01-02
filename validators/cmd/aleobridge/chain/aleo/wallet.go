package aleo

type ALEOWallet struct {
	PrivateKey string `json:"private_key"`
	PublicKey  string `json:"public_key"`
	ViewKey    string `json:"view_key"`
	CoinType   string `json:"coin_type"`
}


func (w *ALEOWallet) Sign(data []byte) ([]byte, error){
	return nil, nil 
}

func (w *ALEOWallet) PubKey() string {
	return w.PublicKey
}