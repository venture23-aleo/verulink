package chain

import (
	"encoding/json"
	"fmt"

	chainService "github.com/venture23-aleo/verulink/attestor/chainService/chain"
	"github.com/venture23-aleo/verulink/attestor/signingService/chain/aleo"
	"github.com/venture23-aleo/verulink/attestor/signingService/chain/ethereum"
	"github.com/venture23-aleo/verulink/attestor/signingService/config"
)

const (
	Aleo     = "aleo"
	Ethereum = "ethereum"
)

var (
	chainIDToName = map[string]string{}
	chainIDToType = map[string]string{}
)

// HashAndSign returns the hash and signature according to the destination of the packets
func HashAndSign(data []byte) (hash, signature string, err error) {
	sp := new(chainService.ScreenedPacket)
	err = json.Unmarshal(data, sp)
	if err != nil {
		return
	}

	fmt.Printf("processing packet with srcChainID: %s, destChainID %s and seqNum: %d",
		sp.Packet.Source.ChainID.String(),
		sp.Packet.Destination.ChainID.String(),
		sp.Packet.Sequence,
	)

	chainID := sp.Packet.Destination.ChainID.String()
	chainName := chainIDToName[chainID]
	chainType, ok := chainIDToType[chainID]
	if !ok {
		return "", "", fmt.Errorf("chain-id %s is not supported", chainID)
	}

	switch chainType {
	case Aleo:
		return aleo.HashAndSign(sp)
	case Ethereum:
		return ethereum.HashAndSign(sp, chainName)
	}
	return "", "", fmt.Errorf("chain %s is not supported", chainName)
}

func SetUpChains() {
	for _, chain := range config.GetChains() {
		chainIDToName[chain.ChainID.String()] = chain.Name
		chainIDToType[chain.ChainID.String()] = chain.ChainType
	}
}
