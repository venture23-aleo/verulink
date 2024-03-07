package main

import (
	"context"
	"fmt"

	"github.com/stretchr/testify/assert"
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
	attestor.BuildRelayImage()
	attestor.RunRelayImage()

	if true {
		return
	}

	// start the relays here

	for _, v := range config.Chains {
		switch v.Name {
		case ethereum:
			ok, err := testSuite.ExecuteETHFlow(ctx, v)
			assert.NoError(testSuite.T, err)
			assert.True(testSuite.T, ok)
		case aleo:
			fmt.Println("aleo flow here")
		}
	}
}
