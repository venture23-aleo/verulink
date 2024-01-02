package aleo

import (
	"fmt"
	"math/big"
	"os/exec"
	"strconv"
	"strings"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

func parseMessage(m string) *aleoPacket {
	message := trim(m)
	sMessages := strings.Split(message, ",") // after splitting we get the message in the form [key1:value1,key2:value2, ...]
	_sMessages := sMessages                  // temporarily store sMessages
	sMessages = []string{}                   // empty sMessages

	for i := 0; i < len(_sMessages); i++ {
		msg := _sMessages[i]
		msplit := strings.Split(msg, ":")
		sMessages = append(sMessages, msplit...) // now we get message in the form []string{key1, value1, key2, value2, ...}
	}

	pkt := new(aleoPacket)

	for m, v := range sMessages {
		switch v {
		case "version":
			pkt.version = sMessages[m+1]
		case "sequence":
			pkt.sequence = sMessages[m+1]
		case "source":
			pkt.source.chain_id = sMessages[m+2]
			pkt.source.address = sMessages[m+4]
		case "destination":
			serviceProgram := ""
			pkt.destination.chain_id = sMessages[m+2]
			for i := m + 4; true; i++ {
				if sMessages[i] == "message" {
					break
				}
				serviceProgram += sMessages[i] + " "
			}
			pkt.destination.address = serviceProgram
		case "message":
			denom := ""
			i := 0
			for i = m + 2; true; i++ {
				if sMessages[i] == "sender" {
					break
				}
				denom += sMessages[i] + " "
			}
			pkt.message.token = denom
			sender := sMessages[i+1]
			pkt.message.sender = sender
			receiver := ""
			for i = i + 3; true; i++ {
				if sMessages[i] == "amount" {
					break
				}
				receiver += sMessages[i] + " "
			}
			pkt.message.receiver = receiver
			pkt.message.amount = sMessages[i+1]
		case "height":
			pkt.height = sMessages[m+1]
		}

	}
	return pkt
}

func trim(msg string) string {
	strReplacer := strings.NewReplacer("\\n", "", "{", "", "}", "", "[", "", "]", "", " ", "", "\"", "")
	return strReplacer.Replace(msg)
}

func parseAleoPacket(packet *aleoPacket) (*chain.Packet, error) {
	pkt := new(chain.Packet)
	version, err := strconv.ParseUint(strings.Replace(packet.version, "u8", "", 1), 0, 64)
	if err != nil {
		return nil, err
	}
	pkt.Version = version
	sequence, err := strconv.ParseUint(strings.Replace(packet.sequence, "u32", "", 1), 0, 64)
	if err != nil {
		return nil, err
	}
	pkt.Sequence = sequence

	sourceChainID, err := strconv.ParseUint(strings.Replace(packet.source.chain_id, "u32", "", 1), 0, 64)
	if err != nil {
		return nil, &exec.Error{}
	}
	pkt.Source.ChainID = sourceChainID
	pkt.Source.Address = packet.source.address

	destChainID, err := strconv.ParseUint(strings.Replace(packet.destination.chain_id, "u32", "", 1), 0, 64)
	if err != nil {
		return nil, err
	}

	pkt.Destination.ChainID = destChainID

	pkt.Destination.Address = parseAleoEthAddrToHexString(packet.destination.address)

	pkt.Message.DestTokenAddress = parseAleoEthAddrToHexString(packet.message.token)
	pkt.Message.SenderAddress = packet.message.sender
	pkt.Message.ReceiverAddress = parseAleoEthAddrToHexString(packet.message.receiver)

	amount := &big.Int{}
	pkt.Message.Amount, _ = amount.SetString(strings.Replace(packet.message.amount, "u64", "", 1), 0)

	height, err := strconv.ParseUint(strings.Replace(packet.height, "u32", "", 1), 0, 64)
	if err != nil {
		return nil, err
	}
	pkt.Height = height

	return pkt, nil
}

// constructs "packet" parameter in bridge contract "receive_message" entrypoint.
// return: string :: example ::
// "{version: 0u8, sequence: 1u32, source: { chain_id: 1u32, addr: <source contract address in the form of 32 byte long byte array in which eth address is represented by the last 20 bytes>}....}
func (c *Client) constructAleoPacket(msg *chain.Packet) string {
	constructedPacket := fmt.Sprintf("{ version: %du8, sequence: %du32, source: { chain_id: %du32, addr: %s }, destination: { chain_id: %du32, addr: %s }, message: { token: %s, sender: %s, receiver: %s, amount: %du64 }, height: %du32 }",
		msg.Version, msg.Sequence, msg.Source.ChainID, constructEthAddressForAleoParameter(msg.Source.Address), msg.Destination.ChainID, msg.Destination.Address, msg.Message.DestTokenAddress, constructEthAddressForAleoParameter(msg.Message.SenderAddress),
		msg.Message.ReceiverAddress, msg.Message.Amount, msg.Height)

	return constructedPacket
}

// constructs ethereum address in the format of 32 len byte array string, appending "u8" in every
// array element. The eth address is represented by the last 20 elements in the array and the
// first 12 fields are padded with "0u8"
func constructEthAddressForAleoParameter(serviceContract string) string {
	aleoAddress := "[ "
	serviceContractByte := []byte(serviceContract)
	lenDifference := 32 - len(serviceContractByte)
	for i := 0; i < lenDifference; i++ { // left pad the return by 0 if the len of byte array of address is smaller than 32
		aleoAddress += "0u8, "
	}

	for i := lenDifference; i < 32; i++ {
		aleoAddress += strconv.Itoa(int(serviceContractByte[i-lenDifference])) + "u8 "
		if i != 31 {
			aleoAddress += ","
		}
	}
	aleoAddress += "]"
	return aleoAddress
}

// parses the eth addr in the form [ 0u8, 0u8, ..., 0u8] received from aleo to hex string
// example [0u8, ... * 32]: aleo[u8, 32] -> 0x0.....0 eth:string
func parseAleoEthAddrToHexString(addr string) string {
	addr = strings.ReplaceAll(addr, "u8", "")
	addr = strings.Trim(addr, " ")
	splittedAddress := strings.Split(addr, " ")

	var addrbt []byte

	for i := 12; i < len(splittedAddress)-1; i++ {
		bt, _ := strconv.ParseUint(splittedAddress[i], 0, 8)

		addrbt = append(addrbt, uint8(bt))
	}

	return ethCommon.Bytes2Hex(addrbt)

}
