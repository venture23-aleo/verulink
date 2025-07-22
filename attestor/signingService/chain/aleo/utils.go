package aleo

import (
	"fmt"
	"strconv"

	ethCommon "github.com/ethereum/go-ethereum/common"
	chainService "github.com/venture23-aleo/verulink/attestor/chainService/chain"
)

// formats packet for aleo bridge contract
// return: string :: example ::
// "{version: 0u8, sequence: 1u64, source: { chain_id: 1u64, addr: <source contract address in the form of len 32 long byte array in which eth address is represented by the last 20 bytes>}....}
func constructAleoPacket(pkt *chainService.Packet) (string, error) {

	sourceAddress, err := constructEthAddressForAleoParameter(pkt.Source.Address)

	if err != nil {
		return "", err
	}

	senderAddress, err := constructEthAddressForAleoParameter(pkt.Message.SenderAddress)

	if err != nil {
		return "", err
	}

	return fmt.Sprintf(
		"{ version: %du8, sequence: %du64, "+
			"source: { chain_id: %du128, addr: %s }, "+
			"destination: { chain_id: %du128, addr: %s }, "+
			"message: { sender_address: %s, dest_token_id: %s , amount: %du128 , receiver_address: %s }, "+
			"height: %du64 }",
		pkt.Version, pkt.Sequence, pkt.Source.ChainID,
		sourceAddress,
		pkt.Destination.ChainID, pkt.Destination.Address,
		senderAddress, pkt.Message.DestTokenAddress, pkt.Message.Amount,
		pkt.Message.ReceiverAddress, pkt.Height), nil
}

// constructs ethereum address in the format of 32 len byte array string, appending "u8" in every
// array element. The eth address is represented by the last 20 elements in the array and the
// first 12 fields are padded with "0u8"
func constructEthAddressForAleoParameter(serviceContract string) (string, error) {
	aleoAddress := "[ "
	if !ethCommon.IsHexAddress(serviceContract) {
		err := fmt.Errorf("not a valid ethereum address %s", serviceContract)
		return "", err
	}
	serviceContractByte := ethCommon.HexToAddress(serviceContract).Bytes()
	lenDifference := 32 - len(serviceContractByte)
	for i := 0; i < lenDifference; i++ { // left pad the return by 0 if the len of byte array of address is smaller than 32
		aleoAddress += "0u8, "
	}

	appendString := "u8, "
	for i := lenDifference; i < 32; i++ {
		aleoAddress += strconv.Itoa(int(serviceContractByte[i-lenDifference])) + appendString
	}

	l := len(appendString) - len("u8")
	return aleoAddress[:len(aleoAddress)-l] + " ]", nil
}

func constructAleoScreeningPacket(packetHash, screening string) string {
	return fmt.Sprintf("{packet_hash:%s,screening_passed:%s}", packetHash, screening)
}
