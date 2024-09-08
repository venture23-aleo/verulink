package main

import (
	"errors"
	"flag"
	"fmt"
	"log"
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
	flag.StringVar(&address, "address", "0.0.0.0", "network address")
	flag.IntVar(&port, "port", 8080, "port")
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
		err = fmt.Errorf("can not load config path: %w", err)
		log.Println(err)
		return
	}

	if !aleo.IsAhsCommandAvailable() {
		err = errors.New("Ahs(Aleo hasher+signer) command is not available")
		log.Println(err)
		return
	}

	// key verification

	m, err := config.LoadKeys(keyPath)
	if err != nil {
		err = fmt.Errorf("unable to load keys: %w", err)
		log.Println(err)
		return
	}

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
			err = fmt.Errorf("error setting up private key: %w", err)
			log.Println(err)
			return
		}
	}

	chain.SetUpChains()

	registerHandlers()
	fmt.Println("starting to serve")
	serve()
}
