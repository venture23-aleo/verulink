package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"

	"github.com/venture23-aleo/attestor/chainService/config"
	"github.com/venture23-aleo/attestor/chainService/logger"
	"github.com/venture23-aleo/attestor/chainService/relay"
	"github.com/venture23-aleo/attestor/chainService/store"
)

func main() {
	err := config.InitConfig()
	if err != nil {
		fmt.Println("Error while loading config. ", err)
		os.Exit(1)
	}

	if config.GetConfig().Mode == config.Development {
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
