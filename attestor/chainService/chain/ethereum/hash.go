package ethereum

import (
	"encoding/binary"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/venture23-aleo/attestor/chainService/chain"
)

func hash(sp *chain.ScreenedPacket) string {
	versionBytes := make([]byte, 32)
	binary.BigEndian.PutUint64(versionBytes[len(versionBytes)-8:], uint64(sp.Packet.Version))

	sequenceBytes := make([]byte, 32)
	binary.BigEndian.PutUint64(sequenceBytes[len(sequenceBytes)-8:], sp.Packet.Sequence)

	heightBytes := make([]byte, 32)
	binary.BigEndian.PutUint64(heightBytes[len(heightBytes)-8:], sp.Packet.Height)

	amountBytes := make([]byte, 32)
	sp.Packet.Message.Amount.FillBytes(amountBytes)

	srcChainIDBytes := make([]byte, 32)
	sp.Packet.Source.ChainID.FillBytes(srcChainIDBytes)

	dstChainIDBytes := make([]byte, 32)
	sp.Packet.Destination.ChainID.FillBytes(dstChainIDBytes)

	pktHash := crypto.Keccak256Hash(
		versionBytes,
		sequenceBytes,
		srcChainIDBytes,
		[]byte(sp.Packet.Source.Address),
		dstChainIDBytes,
		common.HexToAddress(sp.Packet.Destination.Address).Bytes(),
		[]byte(sp.Packet.Message.SenderAddress),
		common.HexToAddress(sp.Packet.Message.DestTokenAddress).Bytes(),
		amountBytes,
		common.HexToAddress(sp.Packet.Message.ReceiverAddress).Bytes(),
		heightBytes,
	)

	hashOfPktHashAndVote := crypto.Keccak256Hash(pktHash.Bytes(), getEthBoolByte(sp.IsWhite))

	finalHash := crypto.Keccak256Hash([]byte(fmt.Sprintf("\x19Ethereum Signed Message:\n%d", len(pktHash))), hashOfPktHashAndVote.Bytes())
	return finalHash.Hex()
}

func getEthBoolByte(b bool) []byte {
	boolByte := make([]byte, 1)
	if b {
		yay := big.NewInt(1)
		yay.FillBytes(boolByte)
	} else {
		nay := big.NewInt(0)
		nay.FillBytes(boolByte)
	}
	return boolByte
}
