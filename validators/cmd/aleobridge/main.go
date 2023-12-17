package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"os/signal"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	_ "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/aleo"
	_ "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/ethereum"
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
		fmt.Printf("Load config failed. Error: %s\n", err.Error())
		os.Exit(1)
	}

	err = validateAndUpdateConfig(cfg)
	if err != nil {
		fmt.Printf("Config validation failed. Error: %s\n", err.Error())
		os.Exit(1)
	}

	signal.Ignore(getIgnoreSignals()...)
	ctx := context.Background()
	ctx, stop := signal.NotifyContext(ctx, getKillSignals()...)
	defer stop()

	multirelayer := relay.MultiRelay(ctx, cfg)
	multirelayer.StartMultiRelay(ctx)

}

func loadConfig(file string) (*relay.Config, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	cfg := &relay.Config{}
	err = json.NewDecoder(f).Decode(cfg)
	if err != nil {
		return nil, err
	}
	return cfg, nil
}

func validateAndUpdateConfig(cfg *relay.Config) error {
	var chains map[string]struct{}
	for _, chainCfg := range cfg.ChainConfigs {
		chains[chainCfg.Name] = struct{}{}
	}

	// bridge pair validation
	bridgePairs := map[string]string{}

	// bridge pair validation might be obsolete as destination chains shall be taken from contract
	for chain1, chain2 := range cfg.BridgePairs {
		if chain1 == chain2 {
			return fmt.Errorf("cannot bridge packects within same chain")
		}
		if _, ok := chains[chain1]; !ok {
			return fmt.Errorf("chain %s is not defined in chainConfig field", chain1)
		}
		if _, ok := chains[chain2]; !ok {
			return fmt.Errorf("chain %s is not defined in chainConfig field", chain2)
		}

		// Config might entail "ethereum": "aleo" or "aleo":"ethereum" or both
		// but we should only take single pair
		if bridgePairs[chain1] == chain2 || bridgePairs[chain2] == chain1 {
			continue
		}
		bridgePairs[chain1] = chain2
	}

	cfg.BridgePairs = bridgePairs
	return nil
}
