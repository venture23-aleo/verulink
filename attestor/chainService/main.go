package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"

	_ "github.com/venture23-aleo/attestor/chainService/chain/aleo"
	_ "github.com/venture23-aleo/attestor/chainService/chain/ethereum"
	"github.com/venture23-aleo/attestor/chainService/config"
	"github.com/venture23-aleo/attestor/chainService/logger"
	"github.com/venture23-aleo/attestor/chainService/relay"
	"github.com/venture23-aleo/attestor/chainService/store"
)

// flags
var (
	configFile string
	devMode    bool
)

func init() {
	flag.StringVar(&configFile, "config", "", "config file")
	flag.BoolVar(&devMode, "mode", true, "Set mode. Especially useful for logging")
}

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

	relay.StartRelay(ctx, config.GetConfig())

}
