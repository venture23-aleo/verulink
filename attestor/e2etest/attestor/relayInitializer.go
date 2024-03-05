package chainservice

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
	Name                            string            `yaml:"name"`
	ChainID                         *big.Int          `yaml:"chain_id"`
	BridgeContract                  string            `yaml:"bridge_contract"`
	NodeUrl                         string            `yaml:"node_url"`
	WaitDuration                    time.Duration     `yaml:"wait_duration"`
	WalletPath                      string            `yaml:"wallet_path"`
	DestChains                      []string          `yaml:"dest_chains"`
	StartSeqNum                     map[string]uint64 `yaml:"sequence_num_start"` // useful for aleo
	StartHeight                     uint64            `yaml:"start_height"`       // useful for ethereum
	FilterTopic                     string            `yaml:"filter_topic"`       // useful for ethereum
	RetryPacketWaitDuration         time.Duration     `yaml:"retry_packet_wait_duration"`
	PruneBasseSeqNumberWaitDuration time.Duration     `yaml:"prune_base_seq_num_wait_duration"`
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

func WriteE2EConifg() {
	relayConfig := &Config{
		ChainConfigs: []*ChainConfig{
			{
				Name:           "aleo",
				ChainID:        big.NewInt(2),
				BridgeContract: "bridge.aleo",
				NodeUrl:        "http://node.url|testnet3",
				WaitDuration:   time.Minute,
				DestChains:     []string{"1"},
				StartSeqNum: map[string]uint64{
					"1": 1,
				},
				RetryPacketWaitDuration:         time.Minute,
				PruneBasseSeqNumberWaitDuration: time.Minute,
			},
			{
				Name:           "ethereum",
				ChainID:        big.NewInt(1),
				BridgeContract: "0x718721F8A5D3491357965190f5444Ef8B3D37553",
				NodeUrl:        "https://rpc.sepolia.org",
				WaitDuration:   time.Minute,
				DestChains:     []string{"2"},
				StartSeqNum: map[string]uint64{
					"2": 1,
				},
				StartHeight:                     100,
				FilterTopic:                     "0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9",
				RetryPacketWaitDuration:         time.Minute,
				PruneBasseSeqNumberWaitDuration: time.Minute,
			},
		},
		LogConfig: &LoggerConfig{
			Encoding:   "console",
			OutputPath: "log",
		},
		DBPath:              "db",
		ConsumePacketWorker: 50,
		Mode:                "dev",
	}
	file, err := os.Create("config.yaml")
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
	composePath := "../../compose.yaml"
	cmd := exec.CommandContext(context.Background(), "docker", "compose", "-f", composePath, "build")
	fmt.Println(cmd.Output())
}

func RunRelayImage() {
	composePath := "../../compose.yaml"
	cmd := exec.CommandContext(context.Background(), "docker", "compose", "-f", composePath, "up")
	fmt.Println(cmd.Output())
}

func StopRelayImage() {
	composePath := "../../compose.yaml"
	cmd := exec.CommandContext(context.Background(), "docker", "compose", "-f", composePath, "down")
	fmt.Println(cmd.Output())
}

// db service
// run image with config

// test conditions:
// eth down
// aleo down
// db down
// self down
// db service message in queue
