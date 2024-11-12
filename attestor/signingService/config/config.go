package config

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"time"

	awscfg "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/aws/aws-sdk-go/aws"

	"gopkg.in/yaml.v3"
)

// Cred denotes the credential needed to request the signing service for hash and signatures on
// packets
type Cred struct {
	Username string `yaml:"username"`
	Password string `yaml:"password"`
}

type ChainConfig struct {
	Name    string   `yaml:"name"`
	ChainID *big.Int `yaml:"chain_id"`
}

type config struct {
	Chains   []ChainConfig `yaml:"chains"`
	Cred     Cred          `yaml:"cred"`
	SecretId string        `yaml:"secret_id"`
	Region   string        `yaml:"region"`
}

// Secret denotes the key pair stored in aws secret manager
type Secret struct {
	EthereumKey     string `json:"ethereum_private_key"`
	EthereumAddress string `json:"ethereum_wallet_address"`
	AleoKey         string `json:"aleo_private_key"`
	AleoAddress     string `json:"aleo_wallet_address"`
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
	chainCfgs := make([]ChainConfig, len(cfg.Chains))
	copy(chainCfgs, cfg.Chains)
	return chainCfgs
}

func GetUsernamePassword() (string, string) {
	return cfg.Cred.Username, cfg.Cred.Password
}

/***********************************Keys***********************************************/

type KeyConfig struct {
	ChainKeys map[string]*KeyPair `yaml:"chain"`
}

type KeyPair struct {
	PrivateKey    string `yaml:"private_key"`
	WalletAddress string `yaml:"wallet_address"`
}

func LoadKeys(isSecretId bool, keyPath string) (map[string]*KeyPair, error) {

	if isSecretId {
		return fetchKeysFromSecretsManager()
	}
	b, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, err
	}
	keyCfg := new(KeyConfig)
	err = yaml.Unmarshal(b, keyCfg)
	if err != nil {
		return nil, err
	}

	return keyCfg.ChainKeys, nil
}

func fetchKeysFromSecretsManager() (map[string]*KeyPair, error) {

	ctx, cncl := context.WithTimeout(context.Background(), time.Minute*1)
	defer cncl()
	awsconfig, err := awscfg.LoadDefaultConfig(ctx, awscfg.WithRegion(cfg.Region))
	if err != nil {
		return nil, fmt.Errorf("unable to load AWS SDK config: %w", err)
	}

	client := secretsmanager.NewFromConfig(awsconfig)

	input := &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(cfg.SecretId),
	}
	result, err := client.GetSecretValue(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("unable to retrieve secret from AWS: %w", err)
	}

	var secretData Secret
	err = json.Unmarshal([]byte(*result.SecretString), &secretData)
	if err != nil {
		return nil, fmt.Errorf("unable to parse secret: %w", err)
	}

	keyCfg := new(KeyConfig)
	keyCfg.ChainKeys = make(map[string]*KeyPair)

	keyCfg.ChainKeys["aleo"] = &KeyPair{
		PrivateKey:    secretData.AleoKey,
		WalletAddress: secretData.AleoAddress,
	}

	keyCfg.ChainKeys["ethereum"] = &KeyPair{
		PrivateKey:    secretData.EthereumKey,
		WalletAddress: secretData.EthereumAddress,
	}

	return keyCfg.ChainKeys, nil
}
