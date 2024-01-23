package config

import (
	"math/big"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

const (
	pairDelimiter = "->"
)

type ChainConfig struct {
	Name           string        `yaml:"name"`
	ChainID        *big.Int        `yaml:"chain_id"`
	BridgeContract string        `yaml:"bridge_contract"`
	NodeUrl        string        `yaml:"node_url"`
	StartFrom      uint64        `yaml:"start_from"`
	WaitDuration   time.Duration `yaml:"wait_duration"`
	WalletPath     string        `yaml:"wallet_path"`
	DestChains     []string      `yaml:"dest_chains"`
}

type Config struct {
	// ChainConfigs is set of configs of chains each required to communicate with its respective bridge contract
	ChainConfigs        []*ChainConfig `yaml:"chains"`
	LogConfig           *LoggerConfig  `yaml:"log"`
	DBPath              string         `yaml:"db_path"`
	ConsumePacketWorker int            `yaml:"consume_packet_worker"`
}

type LoggerConfig struct {
	Encoding   string `yaml:"encoding"`
	OutputPath string `yaml:"output_path"`
}

var config *Config

func GetConfig() *Config {
	return config
}

func LoadConfig(file string) error {
	b, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	err = yaml.Unmarshal(b, config)
	if err != nil {
		return err
	}

	if config.ConsumePacketWorker == 0 {
		config.ConsumePacketWorker = 10
	}

	if config.DBPath == "" {
		config.DBPath = "./bolt.db"
	}

	return nil
}
