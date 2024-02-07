package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"

	_ "github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain/aleo"
	_ "github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain/ethereum"

	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/config"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/logger"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/relay"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/store"
)

func main() {
	err := config.InitConfig()
	if err != nil {
		fmt.Println("Error while loading config. ", err)
		os.Exit(1)
	}

	logger.InitLogging(config.GetConfig().Mode, config.GetConfig().LogConfig)

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
