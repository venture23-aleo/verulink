package relay

import (
	"encoding/json"
	"os"

	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

const (
	EVM  = "ETH"
	ALEO = "ALEO"
)

type ChainConfig struct {
	Name           string   `json:"name"`
	ChainID        uint32   `json:"chain_id"`
	BridgeContract string   `json:"bridge_contract"`
	NodeUrl        string   `json:"node_url"`
	StartHeight    uint64   `json:"start_height"`
	FinalityHeight uint8    `json:"finality_height"`
	WalletPath     string   `json:"wallet_path"`
	DestChains     []string `json:"dest_chains"`
}

type Config struct {
	// ChainConfigs is set of configs of chains each required to communicate with its respective bridge contract
	ChainConfigs []*ChainConfig `json:"chains"`
	// BridgePair is pairing between bridge contracts to communicate packets back and forth

	LogConfig *LoggerConfig `json:"log"`
	DBPath    string        `json:"db_path"`
	/*
		other fields if required
	*/
}

type LoggerConfig struct {
	Encoding   string `json:"encoding"`
	OutputPath string `json:"output_path"`
}

type Wallet struct {
	CoinType string `json:"coin_type"`
}

func LoadJsonFile(file string) *os.File {
	f, err := os.Open(file)
	if err != nil {
		panic("couldnot load file")
	}
	return f
}

func LoadWalletConfig(file string) (common.Wallet, error) {
	f := LoadJsonFile(file)

	cfg := &Wallet{}
	err := json.NewDecoder(f).Decode(cfg)
	if err != nil {
		return nil, err
	}
	switch cfg.CoinType {
	case EVM:
		evmWallet := &common.EVMWallet{}
		f := LoadJsonFile(file)
		err := json.NewDecoder(f).Decode(evmWallet)
		if err != nil {
			return nil, err
		}
		return evmWallet, nil
	case ALEO:
		aleoWallet := &common.ALEOWallet{}
		f := LoadJsonFile(file)
		err := json.NewDecoder(f).Decode(aleoWallet)
		if err != nil {
			return nil, err
		}
		return aleoWallet, nil
	default:
		return nil, nil
	}

}
