package testsuite

import (
	"fmt"

	"github.com/venture23-aleo/attestor/e2etest/common"
)

var (
	RegisteredClients = map[string]common.IClient{}
	RegisteredChains  = map[string]func(*common.ChainConfig) common.IClient{}
)

func GetRegisteredChains() {
	for k, v := range RegisteredClients {
		fmt.Println(k, v)
	}
}
