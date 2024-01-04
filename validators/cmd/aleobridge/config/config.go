package config

import (
	"os"

	"gopkg.in/yaml.v3"
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
	LogConfig    *LoggerConfig  `json:"log"`
	DBPath       string         `json:"db_path"`
}

type LoggerConfig struct {
	Encoding   string `json:"encoding"`
	OutputPath string `json:"output_path"`
}

var config *Config

func GetConfig() *Config {
	return config
}

func LoadConfig(file string) {
	f, err := os.Open(file)
	if err != nil {
		panic(err)
	}
	err = yaml.NewDecoder(f).Decode(config)
	if err != nil {
		panic(err)
	}
}
