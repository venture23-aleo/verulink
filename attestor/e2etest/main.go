package main

import (
	_ "github.com/venture23-aleo/attestor/e2etest/chains/aleo"
	_ "github.com/venture23-aleo/attestor/e2etest/chains/ethereum"
	"github.com/venture23-aleo/attestor/e2etest/common"
	testsuite "github.com/venture23-aleo/attestor/e2etest/testSuite"
)

func main() {
	config, err := common.InitConfig("config.yaml")
	if err != nil {
		panic(err)
	}
	_ = config

	testSuite := testsuite.NewE2ETest()

	testSuite.ExecuteETHFlow()
}
