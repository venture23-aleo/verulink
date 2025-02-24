package config

import (
	"math/big"
	"os"

	"gopkg.in/yaml.v3"
)

// Cred denotes the credential needed to request the signing service for hash and signatures on
// packets
type Cred struct {
	Username string `yaml:"username"`
	Password string `yaml:"password"`
}

type ChainConfig struct {
	Name    string   `yaml:"name"`
	ChainID *big.Int `yaml:"chain_id"`
}

type config struct {
	Chains []ChainConfig `yaml:"chains"`
	Cred   Cred          `yaml:"cred"`
}

var cfg *config

func LoadConfig(configPath string) error {
	b, err := os.ReadFile(configPath)
	if err != nil {
		return err
	}
	cfg = new(config)
	return yaml.Unmarshal(b, cfg)
}

func GetChains() []ChainConfig {
	chainCfgs := make([]ChainConfig, len(cfg.Chains))
	copy(chainCfgs, cfg.Chains)
	return chainCfgs
}

func GetUsernamePassword() (string, string) {
	return cfg.Cred.Username, cfg.Cred.Password
}

/***********************************Keys***********************************************/

type KeyConfig struct {
	ChainKeys map[string]*KeyPair `yaml:"chain"`
}

type KeyPair struct {
	PrivateKey    string `yaml:"private_key"`
	WalletAddress string `yaml:"wallet_address"`
	ChainType     string `yaml:"chain_type"`
}

func LoadKeys(keyPath string) (map[string]*KeyPair, error) {
	b, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, err
	}
	keyCfg := new(KeyConfig)
	err = yaml.Unmarshal(b, keyCfg)
	if err != nil {
		return nil, err
	}

	return keyCfg.ChainKeys, nil
}
