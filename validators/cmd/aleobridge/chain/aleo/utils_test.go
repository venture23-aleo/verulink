package aleo

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"os/exec"
	"strings"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
)

const (
	RpcEndpoint = "3.84.49.97"
)

var (
	cfg = &relay.ChainConfig{
		ChainID:        2,
		NodeUrl:        "http://" + RpcEndpoint + "|testnet3",
		BridgeContract: "bridge.aleo",
		StartHeight:    1,
		WalletPath:     "/home/sheldor/github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/aleo_wallet.json",
	}
)

// client test
func TestGetPacket(t *testing.T) {
	cfg := &relay.ChainConfig{
		ChainID:        2,
		NodeUrl:        "http://" + RpcEndpoint + "|testnet3",
		BridgeContract: "bridge.aleo",
		StartHeight:    1,
		WalletPath:     "/home/sheldor/github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/aleo_wallet.json",
	}
	client := NewClient(cfg)

	mappingValue, err := client.(*Client).GetPktWithSeq(context.Background(), 1, 1)
	assert.Nil(t, err)
	assert.NotNil(t, mappingValue)
	bt, err := json.Marshal(mappingValue)
	assert.Nil(t, err)
	fmt.Println(mappingValue.Message.SenderAddress)
	fmt.Println(string(bt))
}

func TestGetPacket2(t *testing.T) {
	// cfg := &relay.ChainConfig{
	// 	ChainID:        2,
	// 	NodeUrl:        "http://" + RpcEndpoint + "|testnet3",
	// 	BridgeContract: "bridge.aleo",
	// 	StartHeight:    1,
	// 	WalletPath:     "/home/sheldor/github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/aleo_wallet.json",
	// }
	// // client := NewClient(cfg)
	// // key := constructOutMappingKey(1, 1)
	// // // val, err := client.(*Client).aleoClient.GetMappingValue(context.Background(), "bridge.aleo", OUT_PACKET, key)
	// // // assert.Nil(t, err)
	// // // fmt.Println(val[key])

	str := "{\n  version: 0u8,\n  sequence: 1u32,\n  source: {\n    chain_id: 1u32,\n    addr: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px\n  },\n  destination: {\n    chain_id: 1u32,\n    addr: [\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      20u8,\n      119u8,\n      159u8,\n      153u8,\n      43u8,\n      47u8,\n      44u8,\n      66u8,\n      184u8,\n      102u8,\n      15u8,\n      250u8,\n      66u8,\n      219u8,\n      203u8,\n      60u8,\n      124u8,\n      153u8,\n      48u8,\n      176u8\n    ]\n  },\n  message: {\n    token: [\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      20u8,\n      119u8,\n      159u8,\n      153u8,\n      43u8,\n      47u8,\n      44u8,\n      66u8,\n      184u8,\n      102u8,\n      15u8,\n      250u8,\n      66u8,\n      219u8,\n      203u8,\n      60u8,\n      124u8,\n      153u8,\n      48u8,\n      176u8\n    ],\n    sender: aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn,\n    receiver: [\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8,\n      0u8\n    ],\n    amount: 102u64\n  },\n  height: 55u32\n}"
	parseMessage2(str)
}

func parseMessage2(m string) *AleoPacket {
	message := trim2(m)
	splittedMessage := strings.Split(message, ",")
	_splittedMessage := splittedMessage
	splittedMessage = []string{}

	for i := 0; i < len(_splittedMessage); i++ {
		msg := _splittedMessage[i]
		msplit := strings.Split(msg, ":")
		splittedMessage = append(splittedMessage, msplit...)
	}

	pkt := &AleoPacket{}

	for m, v := range splittedMessage {
		switch v {
		case "version":
			pkt.Version = splittedMessage[m+1]
			fmt.Println("::version::", pkt.Version)
		case "sequence":
			pkt.Sequence = splittedMessage[m+1]
			fmt.Println("::sequence::", pkt.Sequence)
		case "source":
			pkt.Source.Chain_id = splittedMessage[m+2]
			fmt.Println("::chainid::", pkt.Source.Chain_id)
			pkt.Source.Address = splittedMessage[m+4]
			fmt.Println("::source service contract::", pkt.Source.Address)
		case "destination":
			serviceProgram := ""
			pkt.Destination.Chain_id = splittedMessage[m+2]
			fmt.Println("::chain id::", pkt.Destination.Chain_id)
			for i := m + 4; true; i++ {
				if splittedMessage[i] == "message" {
					break
				}
				serviceProgram += splittedMessage[i] + " "
			}
			pkt.Destination.Address = serviceProgram
			fmt.Println("::service program::", pkt.Destination.Address)
		case "message":
			denom := ""
			i := 0
			for i = m + 2; true; i++ {
				if splittedMessage[i] == "sender" {
					break
				}
				denom += splittedMessage[i] + " "
			}
			pkt.Message.Denom = denom
			fmt.Println("::message token::", pkt.Message.Denom)
			sender := splittedMessage[i+1]
			pkt.Message.Sender = sender
			fmt.Println("::message sender::", pkt.Message.Sender)
			receiver := ""
			for i = i + 3; true; i++ {
				if splittedMessage[i] == "amount" {
					break
				}
				receiver += splittedMessage[i] + " "
			}
			pkt.Message.Receiver = receiver
			fmt.Println("::receiver::", pkt.Message.Receiver)
			pkt.Message.Amount = splittedMessage[i+1]
			fmt.Println("::message amount::", pkt.Message.Amount)
		case "height":
			pkt.Height = splittedMessage[m+1]
			fmt.Println("::height::", pkt.Height)
		}

	}
	return pkt
}

func trim2(msg string) string {
	// str := strings.ReplaceAll(msg, "\n", "")
	// str = strings.ReplaceAll(str, "{", "")
	// str = strings.ReplaceAll(str, "}", "")
	// str = strings.ReplaceAll(str, "[", "")
	// str = strings.ReplaceAll(str, "]", "")
	// str = strings.ReplaceAll(str, " ", "")
	// str = strings.ReplaceAll(str, "\"", "")
	// return str

	// fmt.Println(msg)

	strReplacer := strings.NewReplacer("\n", "", "{", "", "}", "", "[", "", "]", "", " ", "", "\"", "")
	// fmt.Println(strReplacer.Replace(msg))
	return strReplacer.Replace(msg)
}

func TestMessagePublish(t *testing.T) {
	// aleoPacket := "1u32 \"[ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ]\" \"[ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ]\" \"aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn\" \"[ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8 ]\" 102u64"
	cmd := exec.CommandContext(context.Background(),
		"snarkos", "developer", "execute", "bridge.aleo", "publish",
		"1u32",
		"[ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ]",
		"[ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ]",
		"aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		"[ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8 ]",
		"102u64",
		"--private-key", "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH",
		"--query", "http://"+RpcEndpoint,
		"--broadcast", "http://"+RpcEndpoint+"/testnet3/transaction/broadcast",
		"--priority-fee", "1000")

	output, err := cmd.Output()
	fmt.Println(err)
	assert.Nil(t, err)
	fmt.Println(output)
}

func TestConstructEthAddressForAleo(t *testing.T) {
	modelEthAddress := "[ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ]"
	ethAddress := common.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0")
	ethAddrBt := ethAddress.Bytes()
	ethAddrStr := string(ethAddrBt)

	ethAddressForAleo := constructServiceContractAddress(ethAddrStr)
	assert.Equal(t, modelEthAddress, ethAddressForAleo)

}

func TestParseMessage(t *testing.T) {
	var dst, seqNum uint64 = 1, 1
	key := constructOutMappingKey(uint32(dst), seqNum)
	packet, err := giveOutPackets(key, 1)
	assert.Nil(t, err)
	expectedPacket := &AleoPacket{
		Version:  "0u8",
		Sequence: "1u32",
		Source: AleoPacketNetworkAddress{
			Chain_id: "2u32",
			Address:  "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		Destination: AleoPacketNetworkAddress{
			Chain_id: "1u32",
			Address:  "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8 ",
		},
		Message: AleoMessage{
			Denom:    "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8 ",
			Sender:   "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			Amount:   "102u64",
			Receiver: "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 ",
		},
		Height: "55u32",
	}
	aleoPacket := parseMessage(packet[key])
	assert.Equal(t, expectedPacket, aleoPacket)
}

func TestParseAleoPacket(t *testing.T) {
	var dst, seqNum uint64 = 1, 1
	key := constructOutMappingKey(uint32(dst), seqNum)
	packet, err := giveOutPackets(key, 1)
	assert.Nil(t, err)
	parsedAleoPacket := parseMessage(packet[key])
	commonPacket, err := parseAleoPacket(parsedAleoPacket)
	assert.Nil(t, err)	
	expectedPacket := &chain.Packet{
		Version: uint64(0),
		Sequence: uint64(1),
		Source: chain.NetworkAddress{
			ChainID: uint64(2),
			Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		Destination: chain.NetworkAddress{
			ChainID: uint64(1),
			Address: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0", // converting address of form [0u8, 0u8, ..., 176u8] to str
		},
		Message: chain.Message{
			DestTokenAddress: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
			SenderAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			Amount: big.NewInt(102),
			ReceiverAddress: "0x0000000000000000000000000000000000000000",
		},
		Height: uint64(55),
	}

	assert.Equal(t, commonPacket, expectedPacket)
}

func TestConstructAleoPacket(t *testing.T) {
	modelAleoPacket := "{ version: 0u8, sequence: 1u32, source: { chain_id: 1u32, addr: [ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ] }, destination: { chain_id: 2u32, addr: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px }, message: { token: aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn, sender: [ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ], receiver: aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn, amount: 102u64 }, height: 55u32 }"
	commonPacket := &chain.Packet{
		Version: uint64(0),
		Sequence: uint64(1),
		Source: chain.NetworkAddress{
			ChainID: uint64(1),
			Address: string(ethCommon.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0").Bytes()),
		},
		Destination: chain.NetworkAddress{
			ChainID: uint64(2),
			Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", // converting address of form [0u8, 0u8, ..., 176u8] to str
		},
		Message: chain.Message{
			DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			SenderAddress: string(ethCommon.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0").Bytes()),
			Amount: big.NewInt(102),
			ReceiverAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		},
		Height: uint64(55),
	}

	aleoPacket := constructAleoPacket(commonPacket)
	assert.Equal(t, modelAleoPacket, aleoPacket)
}



