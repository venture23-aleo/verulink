package main

import (
	"context"
	"flag"
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

// flags
var (
	configFile string
	dbPath     string
	logPath    string
	logEnc     string
	mode       string
)

func init() {
	flag.StringVar(&configFile, "config", "", "config file")
	flag.StringVar(&dbPath, "db-path", "", "directory path to store key-value db")
	flag.StringVar(&logPath, "log-path", "", "file path to store logs")
	flag.StringVar(&logEnc, "log-enc", "", "json or console encoding")
	flag.StringVar(&mode, "mode", "dev", "Set mode. Especially useful for logging")
}

func main() {
	flag.Parse()

	cfgArgs := &config.ConfigArgs{
		ConfigFile: configFile,
		DBPath:     dbPath,
		LogPath:    logPath,
		LogEnc:     logEnc,
		Mode:       mode,
	}
	err := config.InitConfig(cfgArgs)
	if err != nil {
		fmt.Println("Error while loading config. ", err)
		os.Exit(1)
	}

	logger.InitLogging(config.GetConfig().Mode, config.GetConfig().LogConfig)
	logger.GetLogger().Info("Attestor started")

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
