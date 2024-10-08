package common

import (
	"os"

	"gopkg.in/yaml.v2"
)

type E2EConfig struct {
	Chains              []*ChainConfig `yaml:"chains"`
	CollectorServiceURI string         `yaml:"collector_service_uri"`
	WriteConfigPath             string   `yaml:"write_config_path"`
}

type ChainConfig struct {
	Name                        string   `yaml:"name"`
	NodeUrl                     string   `yaml:"node_url"`
	BridgeContractAddress       string   `yaml:"bridge_contract_address"`
	TokenServiceContractAddress string   `yaml:"token_service_contract_address"`
	USDCContractAddress         string   `yaml:"usdc_contract_address"`
	WalletPath                  string   `yaml:"wallet_path"`
	WalletAddress               string   `yaml:"wallet_address"`
	ChainID                     string   `yaml:"chain_id"`
	DestChains                  []string `yaml:"dest_chain_ids"`	
}

type Config []*ChainConfig

func InitConfig(configFile string) (config *E2EConfig, err error) {
	b, err := os.ReadFile(configFile)
	if err != nil {
		return nil, err
	}
	config = new(E2EConfig)
	err = yaml.Unmarshal(b, config)
	if err != nil {
		return nil, err
	}
	return config, nil
}
