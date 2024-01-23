package ethereum

import (
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/venture23-aleo/attestor/chainService/chain"
)

func hash(sp *chain.ScreenedPacket) string {
	packet := sp.Packet

	versionBytes := make([]byte, 32)
	packet.Version.FillBytes(versionBytes)
	sequenceBytes := make([]byte, 32)
	packet.Sequence.FillBytes(sequenceBytes)
	heightBytes := make([]byte, 32)
	packet.Height.FillBytes(heightBytes)
	amountBytes := make([]byte, 32)
	packet.Message.Amount.FillBytes(amountBytes)
	srcChainIDBytes := make([]byte, 32)
	packet.Source.ChainID.FillBytes(srcChainIDBytes)
	dstChainIDBytes := make([]byte, 32)
	packet.Destination.ChainID.FillBytes(dstChainIDBytes)

	hash := crypto.Keccak256Hash(
		versionBytes,
		sequenceBytes,
		srcChainIDBytes,
		[]byte(packet.Source.Address),
		dstChainIDBytes,
		common.Hex2Bytes(packet.Destination.Address),
		[]byte(packet.Message.SenderAddress),
		common.Hex2Bytes(packet.Message.DestTokenAddress),
		amountBytes,
		common.Hex2Bytes(packet.Message.ReceiverAddress),
		heightBytes,
	)

	voteByte := make([]byte, 1)
	if sp.IsWhite {
		yay := big.NewInt(1)
		yay.FillBytes(voteByte)
	} else {
		nay := big.NewInt(0)
		nay.FillBytes(voteByte)
	}

	finalHash := crypto.Keccak256Hash([]byte(fmt.Sprintf("\x19Ethereum Signed Message:\n%d", len(hash))), hash.Bytes(), voteByte)
	return finalHash.Hex()
}
