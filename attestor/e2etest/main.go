package main

import (
	"context"

	"github.com/venture23-aleo/attestor/e2etest/attestor"
	_ "github.com/venture23-aleo/attestor/e2etest/chains/aleo"
	_ "github.com/venture23-aleo/attestor/e2etest/chains/ethereum"
	"github.com/venture23-aleo/attestor/e2etest/common"
	testsuite "github.com/venture23-aleo/attestor/e2etest/testSuite"
)

const (
	ethereum = "ethereum"
	aleo     = "aleo"
)

func main() {
	config, err := common.InitConfig("config.yaml")
	if err != nil {
		panic(err)
	}
	_ = config

	testSuite := testsuite.NewE2ETest()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// start the attestor
	attestor.WriteE2EConifg("/home/sheldor/github.com/venture23-aleo/new-architecture/aleo-bridge/attestor/chainService/config.yaml", "https://endpoints.omniatech.io/v1/eth/sepolia/public", "https://api.explorer.aleo.org/v1|testnet3", 5434359, 17)
	attestor.RunRelayImage()

	// start the relays here

	for _, v := range config.Chains {
		switch v.Name {
		case ethereum:
			testSuite.ExecuteETHFlow(ctx, v, config.CollectorServiceURI)
		case aleo:
			testSuite.ExecuteALEOFlow(ctx, v, config.CollectorServiceURI)
		}
	}
}
