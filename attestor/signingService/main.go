package main

import (
	"errors"
	"flag"
	"fmt"
	"os"

	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/chain"
	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/chain/aleo"
	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/chain/ethereum"
	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/config"
)

var (
	keyPath    string
	configPath string
	address    string
	port       int
)

func init() {
	flag.StringVar(&keyPath, "kp", "", "yaml file that contains key pair for each chain's wallet")
	flag.StringVar(&configPath, "config", "config.yaml", "configuration for running signing service")
	flag.StringVar(&address, "address", "127.0.0.1", "network address")
	flag.IntVar(&port, "port", 6579, "port")
}

func main() {
	var err error
	defer func() {
		if err != nil {
			fmt.Fprint(os.Stdin, err.Error())
			os.Exit(1)
		}
	}()

	flag.Parse()

	err = config.LoadConfig(configPath)
	if err != nil {
		return
	}

	if !aleo.IsAhsCommandAvailable() {
		err = errors.New("Ahs(Aleo hasher+signer) command is not available")
		return
	}

	m, err := config.LoadKeys(keyPath)
	for chainName, cfg := range m {
		switch chainName {
		case chain.Aleo:
			err = aleo.SetUpPrivateKey(cfg)
		case chain.Ethereum:
			err = ethereum.SetUpPrivateKey(cfg)
		default:
			err = fmt.Errorf("unsupported chain %s", chainName)
		}

		if err != nil {
			return
		}
	}

	chain.SetUpChains()

	registerHandlers()
	serve()
}
