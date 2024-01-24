package ethereum

import (
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/venture23-aleo/attestor/chainService/chain"
	"github.com/venture23-aleo/attestor/chainService/chain/ethereum/abi"
)

func hash(sp *chain.ScreenedPacket) string {
	packet := abi.PacketLibraryInPacket{
		Version:  big.NewInt(int64(sp.Packet.Version)),
		Sequence: big.NewInt(int64(sp.Packet.Sequence)),
		SourceTokenService: abi.PacketLibraryOutNetworkAddress{
			ChainId: big.NewInt(int64(sp.Packet.Source.ChainID)),
			Addr:    sp.Packet.Source.Address,
		},
		DestTokenService: abi.PacketLibraryInNetworkAddress{
			ChainId: big.NewInt(int64(sp.Packet.Destination.ChainID)),
			Addr:    common.HexToAddress(sp.Packet.Destination.Address),
		},
		Message: abi.PacketLibraryInTokenMessage{
			SenderAddress:    sp.Packet.Message.SenderAddress,
			DestTokenAddress: common.HexToAddress(sp.Packet.Message.DestTokenAddress),
			Amount:           sp.Packet.Message.Amount,
			ReceiverAddress:  common.HexToAddress(sp.Packet.Message.ReceiverAddress),
		},
		Height: big.NewInt(int64(sp.Packet.Height)),
	}

	versionBytes := make([]byte, 32)
	packet.Version.FillBytes(versionBytes)
	sequenceBytes := make([]byte, 32)
	packet.Sequence.FillBytes(sequenceBytes)
	heightBytes := make([]byte, 32)
	packet.Height.FillBytes(heightBytes)
	amountBytes := make([]byte, 32)
	packet.Message.Amount.FillBytes(amountBytes)
	srcChainIDBytes := make([]byte, 32)
	packet.SourceTokenService.ChainId.FillBytes(srcChainIDBytes)
	dstChainIDBytes := make([]byte, 32)
	packet.DestTokenService.ChainId.FillBytes(dstChainIDBytes)

	pktHash := crypto.Keccak256Hash(
		versionBytes,
		sequenceBytes,
		srcChainIDBytes,
		[]byte(packet.SourceTokenService.Addr),
		dstChainIDBytes,
		packet.DestTokenService.Addr.Bytes(),
		[]byte(packet.Message.SenderAddress),
		packet.Message.DestTokenAddress.Bytes(),
		amountBytes,
		packet.Message.ReceiverAddress.Bytes(),
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

	hashOfPktHashAndVote := crypto.Keccak256Hash(pktHash.Bytes(), voteByte)

	finalHash := crypto.Keccak256Hash([]byte(fmt.Sprintf("\x19Ethereum Signed Message:\n%d", len(pktHash))), hashOfPktHashAndVote.Bytes())
	return finalHash.Hex()
}
