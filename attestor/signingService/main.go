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
	aleoKeyPath      string
	ethKeyPath       string
	aleoDecryptKey   string
	aleoDecryptNonce string
	ethDecryptKey    string
	configPath       string
	address          string
	port             int
	encryptCommand   string
	aleoPrivateKey   string
	keyPassword      string
	confirmPassword  string
)

func init() {
	flag.StringVar(&aleoKeyPath, "aleo-kp", "", "path to encrypted aleo key-pairs")
	flag.StringVar(&ethKeyPath, "eth-kp", "", "path to encrypted ethereum key-pairs")
	flag.StringVar(&configPath, "config", "config.yaml", "configuration for running signing service")
	flag.StringVar(&address, "address", "127.0.0.1", "network address")
	flag.StringVar(&encryptCommand, "encryptKey", "", "encrypt raw aleo private key")
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

	if encryptCommand != "" {
		readInputsForKeyEncryption()
		aleo.EncryptPrivateKey(aleoPrivateKey, keyPassword)
		return
	}

	if aleoKeyPath == "" {
		err = errors.New("aleo key path is required")
		return
	}

	if ethKeyPath == "" {
		err = errors.New("ethereum key path is required")
		return
	}

	err = config.LoadConfig(configPath)
	if err != nil {
		return
	}

	if !aleo.IsAhsCommandAvailable() {
		err = errors.New("Ahs(Aleo hasher+signer) command is not available")
		return
	}

	err = readInputs()
	if err != nil {
		return 
	}
	
	err = aleo.SetUpPrivateKey(aleoKeyPath, aleoDecryptKey, aleoDecryptNonce)
	if err != nil {
		return
	}

	err = ethereum.SetUpPrivateKey(ethKeyPath, ethDecryptKey)
	if err != nil {
		return
	}

	chain.SetUpChains()

	registerHandlers()
	serve()
}
