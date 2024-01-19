package config

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

const (
	pairDelimiter = "->"
)

type ChainConfig struct {
	Name           string        `yaml:"name"`
	ChainID        uint32        `yaml:"chain_id"`
	BridgeContract string        `yaml:"bridge_contract"`
	NodeUrl        string        `yaml:"node_url"`
	StartFrom      uint64        `yaml:"start_from"`
	WaitDuration   time.Duration `yaml:"wait_duration"`
	WalletPath     string        `yaml:"wallet_path"`
	DestChains     []string      `yaml:"dest_chains"`
}

type Config struct {
	// ChainConfigs is set of configs of chains each required to communicate with its respective bridge contract
	ChainConfigs  []*ChainConfig                 `yaml:"chains"`
	LogConfig     *LoggerConfig                  `yaml:"log"`
	DBPath        string                         `yaml:"db_path"`
	BridgePair    []string                       `yaml:"bridge_pair"`
	BridgePairMap map[string]map[string]struct{} `yaml:"-"`
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

	bridgeM := make(map[string]map[string]struct{})
	var errs []error
	for _, pair := range cfg.BridgePair {
		s := strings.Split(pair, pairDelimiter)
		src, dest := s[0], s[1]
		if _, ok := chains[src]; !ok {
			errs = append(errs, fmt.Errorf("chain %s is not defined", src))
		}
		if _, ok := chains[dest]; !ok {
			errs = append(errs, fmt.Errorf("chain %s is not defined", dest))
		}

		if _, ok := bridgeM[src]; !ok {
			bridgeM[src] = make(map[string]struct{})
		}
		bridgeM[src][dest] = struct{}{}
	}

	if len(errs) > 0 {
		return errors.Join(errs...)
	}
	cfg.BridgePairMap = bridgeM
	return nil
}
