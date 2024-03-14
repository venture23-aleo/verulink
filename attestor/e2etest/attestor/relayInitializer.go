package attestor

import (
	"context"
	"fmt"
	"math/big"
	"os"
	"os/exec"
	"time"

	"gopkg.in/yaml.v3"
)

type ChainConfig struct {
	Name                       string            `yaml:"name"`
	ChainID                    *big.Int          `yaml:"chain_id"`
	BridgeContract             string            `yaml:"bridge_contract"`
	NodeUrl                    string            `yaml:"node_url"`
	PacketValidityWaitDuration time.Duration     `yaml:"pkt_validity_wait_dur"`
	FeedPacketWaitDuration     time.Duration     `yaml:"feed_pkt_wait_dur"`
	FinalityHeight             uint64            `yaml:"finality_height"`
	WalletPath                 string            `yaml:"wallet_path"`
	DestChains                 []string          `yaml:"dest_chains"`
	WalletAddress              string            `yaml:"wallet_address"`
	StartSeqNum                map[string]uint64 `yaml:"sequence_num_start"` // useful for aleo
	StartHeight                uint64            `yaml:"start_height"`       // useful for ethereum
	FilterTopic                string            `yaml:"filter_topic"`       // useful for ethereum
	RetryPacketWaitDur         time.Duration     `yaml:"retry_packet_wait_dur"`
	PruneBaseSeqNumberWaitDur  time.Duration     `yaml:"prune_base_seq_num_wait_dur"`
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
	Uri string `yaml:"uri"`
}

type Config struct {
	// ChainConfigs is set of configs of chains each required to communicate with its respective bridge contract
	ChainConfigs           []*ChainConfig         `yaml:"chains"`
	LogConfig              *LoggerConfig          `yaml:"log"`
	DBDir                  string                 `yaml:"db_dir"`
	DBPath                 string                 `yaml:"-"` // Calculate based on DBDir
	ConsumePacketWorker    int                    `yaml:"consume_packet_workers"`
	Mode                   string                 `yaml:"mode"`
	SigningServiceConfig   SigningServiceConfig   `yaml:"signing_service"`
	CollectorServiceConfig CollecterServiceConfig `yaml:"collector_service"`
}
type LoggerConfig struct {
	Encoding   string `yaml:"encoding"`
	OutputPath string `yaml:"output_dir"`
}

func WriteE2EConifg(path, ethNodeURL, aleoNodeURL string, ethStartHeight, aleoStartSeqNumber uint64) {
	relayConfig := &Config{
		ChainConfigs: []*ChainConfig{
			{
				Name:           "aleo",
				ChainID:        big.NewInt(6694886634403),
				WalletAddress:  "aleo1zgyyxkjxadc4y7aks4rscmz6sq59wljrjckuwgrwsx034uxkkuyqmtjdw7",
				BridgeContract: "token_bridge_v0002.aleo",
				NodeUrl:        aleoNodeURL,
				StartSeqNum: map[string]uint64{
					"ethereum": aleoStartSeqNumber,
				},
				PacketValidityWaitDuration: time.Minute,
				FinalityHeight:             1,
				RetryPacketWaitDur:         time.Minute,
				PruneBaseSeqNumberWaitDur:  time.Minute,
				DestChains:                 []string{"ethereum"},
			},
			{
				Name:                       "ethereum",
				ChainID:                    big.NewInt(28556963657430695),
				WalletAddress:              "0x5Dc561633F195d44a530CdF0f288a409286797ff",
				BridgeContract:             "0xC89f5074765Ac2aF3E3b0D9C9fc6079895F02193",
				NodeUrl:                    ethNodeURL,
				StartHeight:                ethStartHeight,
				FinalityHeight:             1,
				FilterTopic:                "0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9",
				FeedPacketWaitDuration:     time.Second * 2,
				PacketValidityWaitDuration: time.Second * 2,
				RetryPacketWaitDur:         time.Minute,
				PruneBaseSeqNumberWaitDur:  time.Minute,
				DestChains:                 []string{"aleo"},
			},
		},
		LogConfig: &LoggerConfig{
			Encoding:   "console",
			OutputPath: "log",
		},
		DBPath:              "db",
		ConsumePacketWorker: 50,
		Mode:                "dev",
		SigningServiceConfig: SigningServiceConfig{
			Host:     "signingservice",
			Port:     8080,
			Endpoint: "/sign",
			Scheme:   "http",
			Username: "username",
			Password: "password",
		},
		CollectorServiceConfig: CollecterServiceConfig{
			Uri: "https://aleobridge-dbservice-develop.b08qlu4v33brq.us-east-1.cs.amazonlightsail.com/",
		},
	}

	file, err := os.Create(path)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	encoder := yaml.NewEncoder(file)
	err = encoder.Encode(relayConfig)
	if err != nil {
		panic(err)
	}
}

func BuildRelayImage() {
	fmt.Println("🔨 building relay image")
	composePath := "../compose.yaml"
	cmd := exec.CommandContext(context.Background(), "docker", "compose", "-f", composePath, "build")
	_, err := cmd.Output()
	if err != nil {
		fmt.Println("💥 build failed")
		panic(err)
	}
	fmt.Println("🏠 image built. now starting chain service and signing service")
}

func RunRelayImage(relativePath string) {
	cmd := exec.CommandContext(context.Background(), "docker", "compose", "-f", relativePath, "up", "-d")
	_, err := cmd.Output()
	if err != nil {
		fmt.Println("🔴 could not start chain and signing service")
		panic(err)
	}
	fmt.Println("🟢 relay started")
}

func StopRelayImage(relativePath string) {
	cmd := exec.CommandContext(context.Background(), "docker", "compose", "-f", relativePath, "down")
	_, err := cmd.Output()
	if err != nil {
		fmt.Println("🔴 could not bring relay down")
		panic(err)
	}
	fmt.Println("🛬 relay stopped")
}

// db service
// run image with config

// test conditions:
// eth down
// aleo down
// db down
// self down
// db service message in queue
