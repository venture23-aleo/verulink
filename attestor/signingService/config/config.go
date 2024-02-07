package config

import (
	"math/big"
	"os"

	"gopkg.in/yaml.v3"
)

type Cred struct {
	Username string `yaml:"username"`
	Password string `yaml:"password"`
}

type ChainConfig struct {
	Name    string   `yaml:"name"`
	ChainID *big.Int `yaml:"chain_id"`
}

type config struct {
	chains []ChainConfig `yaml:"chains"`
	cred   Cred          `yaml:"cred"`
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
	chainCfgs := make([]ChainConfig, len(cfg.chains))
	copy(chainCfgs, cfg.chains)
	return chainCfgs
}

func GetUsernamePassword() (string, string) {
	return cfg.cred.Username, cfg.cred.Password
}
