package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/push"
	_ "github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain/aleo"
	_ "github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain/ethereum"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/metrics"
	"go.uber.org/zap"

	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/config"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/logger"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/relay"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/store"
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

	host := config.GetConfig().MetricConfig.Host

	job := config.GetConfig().MetricConfig.JobName

	// mode := config.GetConfig().Mode
	// TODO: this change is only for staging branch
	mode = "staging"
	pusher := push.New(host, job).Grouping("instance", mode)

	pmetrics := metrics.NewPrometheusMetrics()
	go func() {

		for range time.Tick(5 * time.Second) {
			gatherer := prometheus.Gatherers{
				pmetrics.Registry,
			}

			if err := pusher.Gatherer(gatherer).Push(); err != nil {
				logger.GetLogger().Error("Error pushing metrics to Pushgateway:", zap.Error(err))

			} else {
				logger.GetLogger().Info("Metrics pushed successfully.")
			}
			pmetrics = metrics.NewPrometheusMetrics()
		}

	}()

	signal.Ignore(getIgnoreSignals()...)
	ctx := context.Background()
	ctx, stop := signal.NotifyContext(ctx, getKillSignals()...)
	defer stop()

	err = store.InitKVStore(config.GetConfig().DBPath)
	if err != nil {
		fmt.Printf("Error while initializing db store: %s\n", err.Error())
		os.Exit(1)
	}

	relay.StartRelay(ctx, config.GetConfig(), pmetrics)
}
