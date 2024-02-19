package chain

import (
	"encoding/json"
	"fmt"

	chainService "github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/chain/aleo"
	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/chain/ethereum"
	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/config"
)

const (
	Aleo     = "aleo"
	Ethereum = "ethereum"
)

var (
	chainIDToName = map[string]string{}
)

func HashAndSign(data []byte) (hash, signature string, err error) {
	sp := new(chainService.ScreenedPacket)
	err = json.Unmarshal(data, sp)
	if err != nil {
		return
	}

	chainID := sp.Packet.Destination.ChainID.String()
	chainName, ok := chainIDToName[chainID]
	if !ok {
		return "", "", fmt.Errorf("chain-id %s is not supported", chainID)
	}

	switch chainName {
	case Aleo:
		return aleo.HashAndSign(sp)
	case Ethereum:
		return ethereum.HashAndSign(sp)
	}
	return "", "", fmt.Errorf("chain %s is not supported", chainName)
}

func SetUpChains() {
	for _, chain := range config.GetChains() {
		chainIDToName[chain.ChainID.String()] = chain.Name
	}
}
