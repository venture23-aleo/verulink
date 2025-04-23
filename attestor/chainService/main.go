package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"

	_ "github.com/venture23-aleo/verulink/attestor/chainService/chain/aleo"
	_ "github.com/venture23-aleo/verulink/attestor/chainService/chain/ethereum"
	"github.com/venture23-aleo/verulink/attestor/chainService/metrics"
	"go.uber.org/zap"
	
	"github.com/venture23-aleo/verulink/attestor/chainService/config"
	"github.com/venture23-aleo/verulink/attestor/chainService/logger"
	"github.com/venture23-aleo/verulink/attestor/chainService/relay"
	"github.com/venture23-aleo/verulink/attestor/chainService/store"

)

// flags
var (
	configFile string
	dbDir      string
	logDir     string
	logEnc     string
	mode       string
	cleanStart bool
)

func init() {
	flag.StringVar(&configFile, "config", "", "config file")
	flag.StringVar(&dbDir, "db-dir", "", "directory path to store key-value db")
	flag.StringVar(&logDir, "log-dir", "", "file path to store logs")
	flag.StringVar(&logEnc, "log-enc", "", "json or console encoding")
	flag.StringVar(&mode, "mode", "dev", "Set mode. Especially useful for logging")
	flag.BoolVar(&cleanStart, "clean", false, "Remove local db and start")
}

func main() {
	flag.Parse()

	flagArgs := &config.FlagArgs{
		ConfigFile: configFile,
		DBDir:      dbDir,
		LogDir:     logDir,
		LogEnc:     logEnc,
		Mode:       mode,
		CleanStart: cleanStart,
	}

	err := config.InitConfig(flagArgs)
	if err != nil {
		fmt.Println("Error while loading config. ", err)
		os.Exit(1)
	}

	logger.InitLogging(config.GetConfig().Mode, config.GetConfig().Name, config.GetConfig().LogConfig)
	logger.GetLogger().Info("Attestor started")

	pusher, err := metrics.InitMetrics(config.GetConfig().CollectorServiceConfig, config.GetConfig().MetricConfig)
	if err != nil {
		logger.GetLogger().Error("Error initializing metrics logging", zap.Error(err))
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

	// TODO: currently embaded only for migration. remove for future releases
	if err := store.MigrateKVStore(); err != nil {
		logger.GetLogger().Error("Migration failed", zap.Error(err))
	}

	pmetrics := metrics.NewPrometheusMetrics()
	go metrics.PushMetrics(ctx, pusher, pmetrics)
	pmetrics.StartVersion(logger.AttestorName, config.GetConfig().Version)

	relay.StartRelay(ctx, config.GetConfig(), pmetrics)
}
