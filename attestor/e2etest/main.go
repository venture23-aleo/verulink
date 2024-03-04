package main

import (
	"fmt"

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

	for _, v := range config.Chains {
		client, ok := testsuite.RegisteredChains[v.Name]
		if !ok {
			panic(fmt.Sprintf("chain not registered %s", v.Name))
		}
		testsuite.RegisteredClients[v.Name] = client(v)
	}
	testsuite.GetRegisteredChains()
}
