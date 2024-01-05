package aleo

import (
	"errors"
	"fmt"
	"math/big"
	"os/exec"
	"strconv"
	"strings"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

func constructOutMappingKey(dst uint32, seqNum uint64) (mappingKey string) {
	return fmt.Sprintf("{chain_id:%du32,sequence:%du32}", dst, seqNum)
}

// after splitting we get the message in the form [key1:value1,key2:value2, ...]
// now we get message in the form []string{key1, value1, key2, value2, ...}
func parseMessage(s string) (pkt *aleoPacket, err error) {
	defer func() {
		if r := recover(); r != nil {
			pkt = nil
			err = fmt.Errorf("error %v while parsing message", r)
		}
	}()

	sMessages := strings.Split(trim(s), ",")
	var messages []string

	for i := 0; i < len(sMessages); i++ {
		msg := sMessages[i]
		msplit := strings.Split(msg, ":")
		messages = append(messages, msplit...)
	}

	requiredFields := map[string]bool{
		"version":     false,
		"sequence":    false,
		"source":      false,
		"destination": false,
		"message":     false,
		"height":      false,
	}

	pkt = new(aleoPacket)
	for m, v := range messages {
		switch v {
		case "version":
			pkt.version = messages[m+1]
			requiredFields["version"] = true
		case "sequence":
			pkt.sequence = messages[m+1]
			requiredFields["sequence"] = true
		case "source":
			pkt.source.chainID = messages[m+2]
			pkt.source.address = messages[m+4]
			requiredFields["source"] = true
		case "destination":
			serviceProgram := ""
			pkt.destination.chainID = messages[m+2]
			for i := m + 4; i < m+4+32; i++ {
				serviceProgram += messages[i] + " "
			}
			pkt.destination.address = serviceProgram
			requiredFields["destination"] = true
		case "message":
			denom := ""
			i := 0
			for i = m + 2; i < m+2+32; i++ {
				denom += messages[i] + " "
			}
			pkt.message.token = denom
			sender := messages[i+1]
			pkt.message.sender = sender
			receiver := ""
			for j := i + 3; j < i+3+32; j++ {
				receiver += messages[j] + " "
			}
			i = i + 3 + 32
			pkt.message.receiver = receiver
			pkt.message.amount = messages[i+1]
			requiredFields["message"] = true
		case "height":
			pkt.height = messages[m+1]
			requiredFields["height"] = true
		}
	}

	var errs []error
	for field, ok := range requiredFields {
		if !ok {
			errs = append(errs, fmt.Errorf("could not find %s field", field))
		}
	}
	if len(errs) > 0 {
		return nil, errors.Join(errs...)
	}
	return pkt, nil
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

	sourceChainID, err := strconv.ParseUint(strings.Replace(packet.source.chainID, "u32", "", 1), 0, 64)
	if err != nil {
		return nil, &exec.Error{}
	}
	pkt.Source.ChainID = sourceChainID
	pkt.Source.Address = packet.source.address

	destChainID, err := strconv.ParseUint(strings.Replace(packet.destination.chainID, "u32", "", 1), 0, 64)
	if err != nil {
		return nil, err
	}

	pkt.Destination.ChainID = destChainID

	pkt.Destination.Address, err = parseAleoEthAddrToHexString(packet.destination.address)
	if err != nil {
		return nil, err
	}
	pkt.Message.DestTokenAddress, err = parseAleoEthAddrToHexString(packet.message.token)
	if err != nil {
		return nil, err
	}
	pkt.Message.ReceiverAddress, err = parseAleoEthAddrToHexString(packet.message.receiver)
	if err != nil {
		return nil, err
	}
	pkt.Message.SenderAddress = packet.message.sender

	amount := &big.Int{}
	pkt.Message.Amount, _ = amount.SetString(strings.Replace(packet.message.amount, "u64", "", 1), 0)

	height, err := strconv.ParseUint(strings.Replace(packet.height, "u32", "", 1), 0, 64)
	if err != nil {
		return nil, err
	}
	pkt.Height = height

	return pkt, nil
}

// formats packet for aleo bridge contract
// return: string :: example ::
// "{version: 0u8, sequence: 1u32, source: { chain_id: 1u32, addr: <source contract address in the form of len 32 long byte array in which eth address is represented by the last 20 bytes>}....}
func constructAleoPacket(msg *chain.Packet) string {
	return fmt.Sprintf(
		"{ version: %du8, sequence: %du32, "+
			"source: { chain_id: %du32, addr: %s }, "+
			"destination: { chain_id: %du32, addr: %s }, "+
			"message: { token: %s, sender: %s, receiver: %s, amount: %du64 }, "+
			"height: %du32 }",
		msg.Version, msg.Sequence, msg.Source.ChainID,
		constructEthAddressForAleoParameter(msg.Source.Address),
		msg.Destination.ChainID, msg.Destination.Address, msg.Message.DestTokenAddress,
		constructEthAddressForAleoParameter(msg.Message.SenderAddress),
		msg.Message.ReceiverAddress, msg.Message.Amount, msg.Height)
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

	appendString := "u8, "
	for i := lenDifference; i < 32; i++ {
		aleoAddress += strconv.Itoa(int(serviceContractByte[i-lenDifference])) + appendString
	}

	l := len(appendString) - len("u8")
	return aleoAddress[:len(aleoAddress)-l] + " ]"
}

// parses the eth addr in the form [ 0u8, 0u8, ..., 0u8] received from aleo to hex string
// example [0u8, ... * 32]: aleo[u8, 32] -> 0x0.....0 eth:string
func parseAleoEthAddrToHexString(addr string) (string, error) {
	if strings.Count(addr, "u8") != 32 {
		return "", errors.New("invalid address string")
	}
	addr = strings.ReplaceAll(addr, "u8", "")
	addr = strings.Trim(addr, " ")
	splittedAddress := strings.Split(addr, " ")

	var addrbt []byte

	for i := 12; i < len(splittedAddress); i++ {
		bt, err := strconv.ParseUint(splittedAddress[i], 0, 8) // todo do not ignore
		if err != nil {
			return "", err
		}
		addrbt = append(addrbt, uint8(bt))
	}

	return ethCommon.BytesToAddress(addrbt).String(), nil

}
