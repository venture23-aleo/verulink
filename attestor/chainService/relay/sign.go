package relay

import (
	"github.com/venture23-aleo/attestor/chainService/chain"
)

func signScreenedPacket(sp *chain.ScreenedPacket) (string, error) {
	name := chainIDToChainName[sp.Packet.Destination.ChainID]
	hash := RegisteredHashers[name](sp)
	//sign hash from signing service

	_ = hash

	return "", nil
}
