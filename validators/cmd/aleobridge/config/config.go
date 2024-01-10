package config

import (
	"errors"
	"fmt"
	"os"

	"gopkg.in/yaml.v3"
)

type ChainConfig struct {
	Name           string   `yaml:"name"`
	ChainID        uint32   `yaml:"chain_id"`
	BridgeContract string   `yaml:"bridge_contract"`
	NodeUrl        string   `yaml:"node_url"`
	StartHeight    uint64   `yaml:"start_height"`
	FinalityHeight uint8    `yaml:"finality_height"`
	WalletPath     string   `yaml:"wallet_path"`
	DestChains     []string `yaml:"dest_chains"`
}

type Config struct {
	// ChainConfigs is set of configs of chains each required to communicate with its respective bridge contract
	ChainConfigs []*ChainConfig    `yaml:"chains"`
	LogConfig    *LoggerConfig     `yaml:"log"`
	DBPath       string            `yaml:"db_path"`
	BridgePair   map[string]string `yaml:"bridge_pair"`
}

type LoggerConfig struct {
	Encoding   string `yaml:"encoding"`
	OutputPath string `yaml:"output_path"`
}

var config *Config

func GetConfig() *Config {
	return config
}

func LoadAndValidateConfig(file string) error {
	b, err := os.ReadFile(file)
	if err != nil {
		return err
	}
	cfg := new(Config)
	err = yaml.Unmarshal(b, cfg)
	if err != nil {
		return err
	}
	err = validateBridgePair(cfg)
	if err != nil {
		return err
	}
	config = cfg
	return nil
}

func validateBridgePair(cfg *Config) error {
	chains := map[string]struct{}{}
	for _, chain := range cfg.ChainConfigs {
		chains[chain.Name] = struct{}{}
	}

	var errs []error
	for src, dest := range cfg.BridgePair {
		if _, ok := chains[src]; !ok {
			errs = append(errs, fmt.Errorf("chain %s is not defined", src))
		}
		if _, ok := chains[dest]; !ok {
			errs = append(errs, fmt.Errorf("chain %s is not defined", dest))
		}
	}

	if len(errs) > 0 {
		return errors.Join(errs...)
	}
	return nil
}
