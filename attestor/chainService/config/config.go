package config

import (
	"errors"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v3"
)

const (
	Development = "dev"
	Production  = "prod"
)

// flags
var (
	configFile string
	dbPath     string
	logPath    string
	logEnc     string
	mode       string
)

func init() {
	flag.StringVar(&configFile, "config", "", "config file")
	flag.StringVar(&dbPath, "db-path", "", "directory path to store key-value db")
	flag.StringVar(&logPath, "log-path", "", "file path to store logs")
	flag.StringVar(&logEnc, "log-enc", "json", "json or console encoding")
	flag.StringVar(&mode, "mode", "dev", "Set mode. Especially useful for logging")
}

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
	ChainConfigs        []*ChainConfig `yaml:"chains"`
	LogConfig           *LoggerConfig  `yaml:"log"`
	DBPath              string         `yaml:"db_path"`
	ConsumePacketWorker int            `yaml:"consume_packet_worker"`
	Mode                string         `yaml:"mode"`
}

type LoggerConfig struct {
	Encoding   string `yaml:"encoding"`
	OutputPath string `yaml:"output_dir"`
}

var config *Config

func GetConfig() *Config {
	return config
}

func InitConfig() error {
	flag.Parse()
	b, err := os.ReadFile(configFile)
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

	if dbPath != "" {
		err := validateDirectory(dbPath)
		if err != nil {
			return err
		}
		file := filepath.Join(dbPath, "bolt.db")
		config.DBPath = file
	} else if config.DBPath == "" {
		config.DBPath = "./bolt.db"
	}

	if logPath != "" {
		err := validatePath(logPath)
		if err != nil {
			return err
		}
		config.LogConfig.OutputPath = logPath
	} else if config.LogConfig.OutputPath == "" {
		config.LogConfig.OutputPath = "./attestor.log"
	}

	if logEnc != "" {
		config.LogConfig.Encoding = logEnc
	}

	if mode != "" && mode == Production {
		config.Mode = mode
	} else {
		config.Mode = Development
	}
	return nil
}

func validateDirectory(p string) error {
	finfo, err := os.Stat(p)
	if errors.Is(err, os.ErrNotExist) {
		if err := os.MkdirAll(dbPath, 0666); err != nil {
			return err
		}
		return nil
	}
	if !finfo.IsDir() {
		return fmt.Errorf("invalid path %s. Should be directory", dbPath)
	}
	return nil
}

func validatePath(p string) error {
	finfo, err := os.Stat(p)
	if errors.Is(err, os.ErrNotExist) {
		dir := filepath.Dir(p)
		if err := os.MkdirAll(dir, 0666); err != nil {
			return err
		}
		return nil
	}

	if finfo.IsDir() {
		return fmt.Errorf("path %s should not be directory", p)
	}
	return nil
}
