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
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/config"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/logger"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/store"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
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
	err := config.LoadAndValidateConfig(configFile)
	if err != nil {
		fmt.Println("Error while loading config. ", err)
		os.Exit(1)
	}

	if devMode {
		logger.InitLogging(logger.Development, config.GetConfig().LogConfig)
	} else {
		logger.InitLogging(logger.Production, config.GetConfig().LogConfig)
	}

	signal.Ignore(getIgnoreSignals()...)
	ctx := context.Background()
	ctx, stop := signal.NotifyContext(ctx, getKillSignals()...)
	defer stop()

	err = store.InitKVStore(config.GetConfig().DBPath)
	if err != nil {
		fmt.Printf("Error while initializing db store: %s\n", err.Error())
		os.Exit(1)
	}

	multirelayer := relay.MultiRelay(ctx, config.GetConfig().ChainConfigs)
	multirelayer.StartMultiRelay(ctx)

}
