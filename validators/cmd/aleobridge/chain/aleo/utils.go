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

// todo: Recheck
func parseMessage(m string) *AleoPacket {
	message := trim(m)
	splittedMessage := strings.Split(message, " ")

	msg := []string{}
	pkt := AleoPacket{}

	for i := 0; i < len(splittedMessage); i++ {
		if splittedMessage[i] == "" {
			continue
		}
		msg = append(msg, splittedMessage[i])
	}
	for m, v := range msg {
		switch v {
		case "version:":
			pkt.Version = msg[m+1]
		case "sequence:":
			pkt.Sequence = msg[m+1]
		case "source:":
			pkt.Source.Chain_id = msg[m+3]
			pkt.Source.ServiceContract = msg[m+5]
		case "destination:":
			serviceProgram := ""
			pkt.Destination.Chain_id = msg[m+3]
			for i := m + 6; true; i++ {
				if msg[i] == "]" {
					break
				}
				serviceProgram += msg[m+6] + " "
			}
			pkt.Destination.ServiceContract = serviceProgram
		case "message:":
			denom := ""
			i := 0
			for i = m + 4; true; i++ {
				if msg[i] == "]" {
					break
				}
				denom += msg[i] + " "
			}
			pkt.Message.Denom = denom
			sender := msg[i+2]
			pkt.Message.Sender = sender
			receiver := ""
			for i = i + 5; true; i++ {
				if msg[i] == "]" {
					break
				}
				receiver += msg[i] + " "
			}
			pkt.Message.Receiver = receiver
			pkt.Message.Amount = msg[i+2]
		case "height:":
			pkt.Height = strings.ReplaceAll(msg[m+1], "}\"", "")
		}

	}
	return &pkt
}

func trim(msg string) string {
	str := strings.ReplaceAll(msg, "\\n", "")
	return strings.ReplaceAll(str, ",", "")
}

func parseAleoPacket(packet *AleoPacket) (*chain.Packet, error) {
	pkt := new(chain.Packet)
	version, err := strconv.ParseUint(strings.ReplaceAll(packet.Version, "u8", ""), 0, 64)
	if err != nil {
		return nil, err
	}
	pkt.Version = version
	sequence, err := strconv.ParseUint(strings.ReplaceAll(packet.Sequence, "u32", ""), 0, 64)
	if err != nil {
		return nil, err
	}
	pkt.Sequence = sequence

	sourceChainID, err := strconv.ParseUint(strings.ReplaceAll(packet.Source.Chain_id, "u32", ""), 0, 64)
	if err != nil {
		return nil, &exec.Error{}
	}
	pkt.Source.ChainID = sourceChainID
	pkt.Source.Address = packet.Source.ServiceContract

	destChainID, err := strconv.ParseUint(strings.ReplaceAll(packet.Destination.Chain_id, "u32", ""), 0, 64)
	if err != nil {
		return nil, err
	}

	pkt.Destination.ChainID = destChainID

	pkt.Destination.Address = parseEthAddress(packet.Destination.ServiceContract)

	pkt.Message.DestTokenAddress = parseEthAddress(packet.Message.Denom)
	pkt.Message.SenderAddress = packet.Message.Sender
	pkt.Message.ReceiverAddress = parseEthAddress(packet.Message.Receiver)

	amount := &big.Int{}
	pkt.Message.Amount, _ = amount.SetString(strings.ReplaceAll(packet.Message.Amount, "u64", ""), 0)

	height, err := strconv.ParseUint(strings.ReplaceAll(packet.Height, "u32", ""), 0, 64)
	if err != nil {
		return nil, err
	}
	pkt.Height = height

	return pkt, nil
}

func (c *Client) constructAleoPacket(msg *chain.Packet) string {
	// "{ version: " + version + ", sequence: " + sequenceNo + ", source: { chain_id: " + srcChainId + ", addr: " + constructServiceContractAddress(srcServiceContract) + " }, destination: { chain_id: " + dstChainId + ", addr: " + dstserviceContract + " }, message: { token: " + denom + ", sender: " + constructServiceContractAddress(sender) + ", receiver: " + receiver + ", amount: " + amount + " }" + ", height: " + height + " }"
	constructedPacket := fmt.Sprintf("{ version: %du8, sequence: %du32, source: { chain_id: %du32, addr: %s }, destination: { chain_id: %du32, addr: %s }, message: { token: %s, sender: %s, receiver: %s, amount: %du64 }, height: %du32 }",
		msg.Version, msg.Sequence, msg.Source.ChainID, constructServiceContractAddress(msg.Source.Address), msg.Destination.ChainID, msg.Destination.Address, msg.Message.DestTokenAddress, constructServiceContractAddress(msg.Message.SenderAddress), msg.Message.ReceiverAddress, msg.Message.Amount, msg.Height)

	return constructedPacket
}

func constructServiceContractAddress(serviceContract string) string {
	aleoAddress := "[ "
	serviceContractByte := []byte(serviceContract)
	lenDifference := 32 - len(serviceContractByte)
	for i := 0; i < lenDifference; i++ { // left pad the return by 0 if the len of byte array of address is smaller than 32
		aleoAddress += "0u8, "
	}

	for i := lenDifference; i < 32; i++ {
		if i != 31 {
			aleoAddress += strconv.Itoa(int(serviceContractByte[i-lenDifference])) + "u8, "
		} else {
			aleoAddress += strconv.Itoa(int(serviceContractByte[i-lenDifference])) + "u8 "
		}
	}
	aleoAddress += "]"
	return aleoAddress
}

func parseEthAddress(addr string) string {
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
