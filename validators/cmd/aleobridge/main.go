package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	_ "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/aleo"
	_ "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/ethereum"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/logger"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/store"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
	"gopkg.in/yaml.v3"
)

// flags
var (
	configFile string
	devMode    bool
)

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
	flag.BoolVar(&devMode, "mode", true, "Set mode. Especially useful for logging")
}

var (
	Senders   = map[string]SenderFunc{}
	Receivers = map[string]ReceiverFunc{}
)

func main() {
	flag.Parse()
	cfg, err := loadConfig(configFile)
	if err != nil {
		fmt.Printf("Load config failed. Error: %s\n", err.Error())
		os.Exit(1)
	}

	if err != nil {
		fmt.Printf("Config validation failed. Error: %s\n", err.Error())
		os.Exit(1)
	}

	if devMode {
		logger.InitLogging(logger.Development, cfg.LogConfig.OutputPath)
	} else {
		logger.InitLogging(logger.Production, cfg.LogConfig.OutputPath)
	}

	signal.Ignore(getIgnoreSignals()...)
	ctx := context.Background()
	ctx, stop := signal.NotifyContext(ctx, getKillSignals()...)
	defer stop()

	err = store.InitKVStore(cfg.DBPath)
	if err != nil {
		fmt.Printf("Error while initializing db store: %s\n", err.Error())
		os.Exit(1)
	}

	multirelayer := relay.MultiRelay(ctx, cfg)
	multirelayer.StartMultiRelay(ctx)

}

func loadConfig(file string) (*relay.Config, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	cfg := &relay.Config{}
	err = yaml.NewDecoder(f).Decode(cfg)
	if err != nil {
		return nil, err
	}
	return cfg, nil
}
