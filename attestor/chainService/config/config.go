package config

import (
	"errors"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

const (
	Development = "dev"
	Production  = "prod"
)

type ConfigArgs struct {
	ConfigFile string
	DBPath     string
	LogPath    string
	LogEnc     string
	Mode       string
}

type ChainConfig struct {
	Name                      string            `yaml:"name"`
	ChainID                   *big.Int          `yaml:"chain_id"`
	BridgeContract            string            `yaml:"bridge_contract"`
	NodeUrl                   string            `yaml:"node_url"`
	WaitDuration              time.Duration     `yaml:"wait_dur"`
	WalletPath                string            `yaml:"wallet_path"`
	DestChains                []string          `yaml:"dest_chains"`
	WalletAddress             string            `yaml:"wallet_address"`
	StartSeqNum               map[string]uint64 `yaml:"sequence_num_start"` // useful for aleo
	StartHeight               uint64            `yaml:"start_height"`       // useful for ethereum
	FilterTopic               string            `yaml:"filter_topic"`       // useful for ethereum
	RetryPacketWaitDur        time.Duration     `yaml:"retry_packet_wait_dur"`
	PruneBaseSeqNumberWaitDur time.Duration     `yaml:"prune_base_seq_num_wait_dur"`
}

type Config struct {
	// ChainConfigs is set of configs of chains each required to communicate with its respective bridge contract
	ChainConfigs           []*ChainConfig         `yaml:"chains"`
	LogConfig              *LoggerConfig          `yaml:"log"`
	DBPath                 string                 `yaml:"db_path"`
	ConsumePacketWorker    int                    `yaml:"consume_packet_workers"`
	Mode                   string                 `yaml:"mode"`
	SigningServiceConfig   SigningServiceConfig   `yaml:"signing_service"`
	CollectorServiceConfig CollecterServiceConfig `yaml:"collector_service"`
}

type LoggerConfig struct {
	Encoding   string `yaml:"encoding"`
	OutputPath string `yaml:"output_path"`
}

type SigningServiceConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Endpoint string `yaml:"endpoint"`
	Scheme   string `yaml:"scheme"`
	Username string `yaml:"username"`
	Password string `yaml:"password"`
}

type CollecterServiceConfig struct {
	Uri              string        `yaml:"uri"`
	CollectorWaitDur time.Duration `yaml:"collector_wait_dur"`
}

var config *Config

func GetConfig() *Config {
	return config
}

func InitConfig(cfgArgs *ConfigArgs) error {
	b, err := os.ReadFile(cfgArgs.ConfigFile)
	if err != nil {
		return err
	}
	config = new(Config)
	err = yaml.Unmarshal(b, config)
	if err != nil {
		return err
	}

	err = validateChainConfig(config)
	if err != nil {
		return err
	}

	if config.SigningServiceConfig.Scheme != "https" &&
		config.SigningServiceConfig.Scheme != "http" {
		return fmt.Errorf("%s scheme is not supported", config.SigningServiceConfig.Scheme)
	}

	if config.ConsumePacketWorker == 0 {
		config.ConsumePacketWorker = 10
	}

	if cfgArgs.DBPath != "" {
		err := validateDirectory(cfgArgs.DBPath)
		if err != nil {
			return err
		}
		file := filepath.Join(cfgArgs.DBPath, "bolt.db")
		config.DBPath = file
	} else if config.DBPath == "" {
		config.DBPath = "./bolt.db"
	}

	if cfgArgs.LogPath != "" {
		err := validatePath(cfgArgs.LogPath)
		if err != nil {
			return err
		}
		config.LogConfig.OutputPath = filepath.Join(cfgArgs.LogPath, "attestor.log")
	} else if config.LogConfig.OutputPath != "" {
		fileName := filepath.Base(config.LogConfig.OutputPath)
		if strings.HasSuffix(fileName, ".log") {
			dir := filepath.Dir(config.LogConfig.OutputPath)
			err := os.MkdirAll(dir, 0755)
			if err != nil {
				return err
			}
		} else {
			err := validateDirectory(config.LogConfig.OutputPath)
			if err != nil {
				return err
			}
			config.LogConfig.OutputPath = filepath.Join(config.LogConfig.OutputPath, "attestor.log")
		}
	} else {
		config.LogConfig.OutputPath = "./attestor.log"

	}

	if cfgArgs.LogEnc != "" {
		config.LogConfig.Encoding = cfgArgs.LogEnc
	}

	if cfgArgs.Mode == Production {
		config.Mode = cfgArgs.Mode
	} else {
		config.Mode = Development
	}
	return nil
}

func validateDirectory(p string) error {
	finfo, err := os.Stat(p)
	if errors.Is(err, os.ErrNotExist) {
		if err := os.MkdirAll(p, 0666); err != nil {
			return err
		}
		return nil
	}
	if !finfo.IsDir() {
		return fmt.Errorf("invalid path %s. Should be directory", p)
	}
	return nil
}

func validatePath(p string) error {
	finfo, err := os.Stat(p)
	if errors.Is(err, os.ErrNotExist) {
		if err := os.MkdirAll(p, 0666); err != nil {
			return err
		}
		return nil
	}

	if finfo.IsDir() {
		return fmt.Errorf("path %s should not be directory", p)
	}
	return nil
}

func validateChainConfig(cfg *Config) error {
	chainNameToChainID := make(map[string]string)
	for _, chainCfg := range cfg.ChainConfigs {
		chainNameToChainID[chainCfg.Name] = chainCfg.ChainID.String()
	}

	for _, chainCfg := range cfg.ChainConfigs {
		mDestChains := make([]string, len(chainCfg.DestChains))
		mStartSeqMap := make(map[string]uint64)

		for _, name := range chainCfg.DestChains {
			chainID, ok := chainNameToChainID[name]
			if !ok {
				return fmt.Errorf("Chain-id not available for %s", name)
			}
			mDestChains = append(mDestChains, chainID)
		}
		chainCfg.DestChains = mDestChains

		for name, startSeqNum := range chainCfg.StartSeqNum {
			chainID, ok := chainNameToChainID[name]
			if !ok {
				return fmt.Errorf("Chain-id not available for %s", name)
			}
			mStartSeqMap[chainID] = startSeqNum
		}

		chainCfg.StartSeqNum = mStartSeqMap
	}

	return nil
}
