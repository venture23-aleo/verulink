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
	ChainType                  string            `yaml:"chain_type"`
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
	AverageBlockGenDur         time.Duration     `yaml:"average_block_gen_dur"`
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
	MetricConfig           *MetricsConfig         `yaml:"metrics"`
}
type LoggerConfig struct {
	Encoding   string `yaml:"encoding"`
	OutputPath string `yaml:"output_dir"`
}

type MetricsConfig struct {
	Host    string `yaml:"host"`
	JobName string `yaml:"job_name"`
}

func WriteE2EConifg(path, ethNodeURL, baseNodeURL, aleoNodeURL string, ethStartHeight, baseStartHeight, aleoStartSeqNumber uint64, benchmark bool) {
	signingServiceHost := "signingservice"
	if benchmark {
		signingServiceHost = "localhost"
		aleoNodeURL = "http://localhost:3002|testnet"
		ethNodeURL = "http://localhost:3001"
		baseNodeURL = "http://localhost:3003"
	}
	relayConfig := &Config{
		Name: "e2eAttestor",
		ChainConfigs: []*ChainConfig{
			{
				Name:           "aleo",
				ChainType:      "aleo",
				ChainID:        big.NewInt(6694886634403),
				WalletAddress:  "aleo1jelsappz5y0cy54cdqukc6xyvz45f35t99mgmlmu3uu7pndvayyqmnx5za",
				BridgeContract: "token_bridge_stg_v2.aleo",
				NodeUrl:        aleoNodeURL,
				StartSeqNum: map[string]uint64{
					"ethereum": aleoStartSeqNumber,
				},
				PacketValidityWaitDuration: time.Minute * 1,
				FinalityHeight:             21,
				RetryPacketWaitDur:         time.Minute * 2,
				PruneBaseSeqNumberWaitDur:  time.Minute * 5,
				DestChains:                 []string{"ethereum", "base"},
				AverageBlockGenDur:         time.Second * 3,
			},
			{
				Name:                       "ethereum",
				ChainType:                  "ethereum",
				ChainID:                    big.NewInt(28556963657430695),
				WalletAddress:              "0x832894550007B560BD35d28Ce564c2CCD690318F",
				BridgeContract:             "0x302f22Ce7bAb6bf5aEFe6FFBa285E844c7F38EA6",
				NodeUrl:                    ethNodeURL,
				StartHeight:                ethStartHeight,
				FinalityHeight:             1,
				FilterTopic:                "0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9",
				FeedPacketWaitDuration:     time.Minute * 1,
				PacketValidityWaitDuration: time.Minute * 2,
				RetryPacketWaitDur:         time.Minute,
				PruneBaseSeqNumberWaitDur:  time.Minute,
				DestChains:                 []string{"aleo"},
				AverageBlockGenDur:         time.Second * 12,
			},
			{
				Name:                       "base",
				ChainType:                  "ethereum",
				ChainID:                    big.NewInt(84532),
				WalletAddress:              "0x832894550007B560BD35d28Ce564c2CCD690318F",
				BridgeContract:             "",
				NodeUrl:                    baseNodeURL,
				StartHeight:                baseStartHeight,
				FinalityHeight:             1,
				FilterTopic:                "0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9",
				FeedPacketWaitDuration:     time.Minute * 1,
				PacketValidityWaitDuration: time.Minute * 2,
				RetryPacketWaitDur:         time.Minute,
				PruneBaseSeqNumberWaitDur:  time.Minute,
				DestChains:                 []string{"aleo"},
				AverageBlockGenDur:         time.Second * 2,
			},
		},
		CheckHealthServiceDur: time.Minute,
		LogConfig: &LoggerConfig{
			Encoding:   "console",
			OutputPath: "log",
		},
		MetricConfig: &MetricsConfig{
			Host:    "172.17.0.1:9091",
			JobName: "e2etest-push-gateway",
		},
		DBPath:              "db",
		ConsumePacketWorker: 10,
		Mode:                "dev",
		SigningServiceConfig: SigningServiceConfig{
			Host:           signingServiceHost,
			Port:           8080,
			Endpoint:       "/sign",
			Scheme:         "http",
			Username:       "username",
			Password:       "password",
			HealthEndpoint: "/health",
		},
		CollectorServiceConfig: CollecterServiceConfig{
			Uri:                 "https://staging-aleomtls.venture233.xyz",
			CollectorWaitDur:    time.Hour,
			CaCertificate:       "/home/aanya/ibriz/aleo/bridge/verulink/attestor/chainService/.mtls/ca.cer",
			AttestorCertificate: "/home/aanya/ibriz/aleo/bridge/verulink/attestor/chainService/.mtls/attestor9.crt",
			AttestorKey:         "/home/aanya/ibriz/aleo/bridge/verulink/attestor/chainService/.mtls/attestor9.key",
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
	composePath := "../../compose.yaml"
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
