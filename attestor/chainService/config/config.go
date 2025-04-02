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
	Stage       = "stage"
)

const (
	dbFileName  = "verulinkBolt.db"
	logFileName = "verulink.log"
	perm        = 744 // Read, execute and write permission for owner, and read-only permission for others
)

type FlagArgs struct {
	ConfigFile string
	DBDir      string
	LogDir     string
	LogEnc     string
	Mode       string
	CleanStart bool
}

type ChainConfig struct {
	Name                      string                    `yaml:"name"`
	ChainType                 string                    `yaml:"chain_type"`
	ChainID                   *big.Int                  `yaml:"chain_id"`
	BridgeContract            string                    `yaml:"bridge_contract"`
	NodeUrl                   string                    `yaml:"node_url"`
	WalletPath                string                    `yaml:"wallet_path"`
	DestChains                map[string]PktValidConfig `yaml:"dest_chains"`
	WalletAddress             string                    `yaml:"wallet_address"`
	StartSeqNum               map[string]uint64         `yaml:"sequence_num_start"` // useful for aleo
	FilterTopic               string                    `yaml:"filter_topic"`       // useful for ethereum
	RetryPacketWaitDur        time.Duration             `yaml:"retry_packet_wait_dur"`
	PruneBaseSeqNumberWaitDur time.Duration             `yaml:"prune_base_seq_num_wait_dur"`
	AverageBlockGenDur        time.Duration             `yaml:"average_block_gen_dur"` // useful for aleo

}

type PktValidConfig struct {
	PacketValidityWaitDuration time.Duration `yaml:"pkt_validity_wait_dur"`
	FinalityHeight             uint64        `yaml:"finality_height"`
	FeedPacketWaitDuration     time.Duration `yaml:"feed_pkt_wait_dur"`
	StartHeight                uint64        `yaml:"start_height"` // useful for ethereum
}

type Config struct {
	// ChainConfigs is set of configs of chains each required to communicate with its respective bridge contract
	Name                   string                 `yaml:"name"`
	ChainConfigs           []*ChainConfig         `yaml:"chains"`
	LogConfig              *LoggerConfig          `yaml:"log"`
	DBDir                  string                 `yaml:"db_dir"`
	DBPath                 string                 `yaml:"-"` // Calculate based on DBDir
	ConsumePacketWorker    int                    `yaml:"consume_packet_workers"`
	Mode                   string                 `yaml:"mode"`
	SigningServiceConfig   SigningServiceConfig   `yaml:"signing_service"`
	CollectorServiceConfig CollecterServiceConfig `yaml:"collector_service"`
	CheckHealthServiceDur  time.Duration          `yaml:"check_health_service"`
	MetricConfig           MetricsConfig          `yaml:"metrics"`
	Version                string                 `yaml:"version"`
}

type LoggerConfig struct {
	Encoding   string `yaml:"encoding"`
	OutputDir  string `yaml:"output_dir"`
	OutputPath string `yaml:"-"` // calculated based on OutputDir
}

type MetricsConfig struct {
	Host    string `yaml:"host"`
	JobName string `yaml:"job_name"`
}

type SigningServiceConfig struct {
	Host           string `yaml:"host"`
	Port           int    `yaml:"port"`
	Endpoint       string `yaml:"endpoint"`
	Scheme         string `yaml:"scheme"`
	Username       string `yaml:"username"`
	Password       string `yaml:"password"`
	HealthEndpoint string `yaml:"health_end_point"`
}

type CollecterServiceConfig struct {
	Uri                 string        `yaml:"uri"`
	CollectorWaitDur    time.Duration `yaml:"collector_wait_dur"`
	CaCertificate       string        `yaml:"ca_certificate"`
	AttestorCertificate string        `yaml:"attestor_certificate"`
	AttestorKey         string        `yaml:"attestor_key"`
}

var config *Config

func GetConfig() *Config {
	return config
}

func InitConfig(flagArgs *FlagArgs) error {
	b, err := os.ReadFile(flagArgs.ConfigFile)
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

	dbFilePath, err := getPath(flagArgs.DBDir, config.DBDir, dbFileName)
	if err != nil {
		return err
	}
	logFilePath, err := getPath(flagArgs.LogDir, config.LogConfig.OutputDir, logFileName)
	if err != nil {
		return err
	}

	if flagArgs.CleanStart {
		err := os.Remove(dbFilePath)
		if err != nil && !os.IsNotExist(err) {
			return err
		}
	}

	config.DBPath = dbFilePath
	config.LogConfig.OutputPath = logFilePath

	if flagArgs.LogEnc != "" {
		config.LogConfig.Encoding = flagArgs.LogEnc
	}

	if flagArgs.Mode == Production {
		config.Mode = flagArgs.Mode
	} else if flagArgs.Mode == Stage {
		config.Mode = flagArgs.Mode
	} else {
		config.Mode = Development
	}
	return nil
}

func getPath(pathFrmFlag, pathFrmYaml, fileName string) (string, error) {
	if pathFrmFlag != "" {
		err := validateDirectory(pathFrmFlag, fileName)
		if err != nil {
			return "", err
		}
		return filepath.Join(pathFrmFlag, fileName), nil
	}

	if pathFrmYaml != "" {
		err := validateDirectory(pathFrmYaml, fileName)
		if err != nil {
			return "", err
		}
		return filepath.Join(pathFrmYaml, fileName), nil
	}
	return filepath.Join(".", fileName), nil
}

func validateDirectory(p, fileName string) error {
	if strings.Contains(p, fileName) {
		return fmt.Errorf("path %s has ambiguous name. Should not contain %s in directory path",
			p, fileName)
	}

	finfo, err := os.Stat(p)
	if errors.Is(err, os.ErrNotExist) {
		if err := os.MkdirAll(p, perm); err != nil {
			return err
		}
		return nil
	}

	if !finfo.IsDir() {
		return fmt.Errorf("invalid path %s. Should be directory", p)
	}
	return nil
}

func validateChainConfig(cfg *Config) error {
	chainNameToChainID := make(map[string]string)
	for _, chainCfg := range cfg.ChainConfigs {
		chainNameToChainID[chainCfg.Name] = chainCfg.ChainID.String()
	}

	for _, chainCfg := range cfg.ChainConfigs {
		mDestChains := make(map[string]PktValidConfig)
		mStartSeqMap := make(map[string]uint64)

		for name, pktValidCfg := range chainCfg.DestChains {
			chainID, ok := chainNameToChainID[name]
			if !ok {
				return fmt.Errorf("chain-id not available for %s", name)
			}
			mDestChains[chainID] = pktValidCfg
		}
		chainCfg.DestChains = mDestChains
		
		for name, startSeqNum := range chainCfg.StartSeqNum {
			chainID, ok := chainNameToChainID[name]
			if !ok {
				return fmt.Errorf("chain-id not available for %s", name)
			}
			mStartSeqMap[chainID] = startSeqNum
		}

		chainCfg.StartSeqNum = mStartSeqMap
	}

	return nil
}
