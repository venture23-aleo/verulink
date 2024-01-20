package relay

import "github.com/venture23-aleo/attestor/chainService/chain"

func sendToCollector(sp *chain.ScreenedPacket, signature string) error {
	// todo: need to send srcChainId, destChainID, packetSeqNum, signature and probably isWhite
	return nil
}
