package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

var configFile string

type Receiver struct {
	Src    string
	Dst    string
	Client Client
}
type Client struct{}

type SenderFunc func(src, dst, url string, wallet common.Wallet) chain.ISender
type ReceiverFunc func(src string, dst []string, nodeAddress string) chain.IReceiver

func init() {
	flag.StringVar(&configFile, "config", "", "config file")
}

var (
	Senders   = map[string]SenderFunc{}
	Receivers = map[string]ReceiverFunc{}
)

func main() {
	flag.Parse()
	cfg, err := loadConfig(configFile)
	if err != nil {
		return
	}

	for _, value := range(cfg.Chains) {
		fmt.Println(value)
	}

}

func loadConfig(file string) (*relay.AppConfig, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	cfg := &relay.AppConfig{}
	err = json.NewDecoder(f).Decode(cfg)
	if err != nil {
		return nil, err
	}
	return cfg, nil
}

// bolt db
