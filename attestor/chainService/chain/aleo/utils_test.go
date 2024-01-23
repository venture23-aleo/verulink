package aleo

import (
	"fmt"
	"math/big"
	"math/rand"
	"strings"
	"testing"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/venture23-aleo/attestor/chainService/chain"
)

func dumpAleoPacket(pkt *aleoPacket, malform bool) string {
	destAddr := strings.Trim(pkt.destination.address, " ")
	destAddr = "[" + strings.ReplaceAll(destAddr, " ", ", ") + "]"
	msgToken := strings.Trim(pkt.message.token, " ")
	msgToken = "[" + strings.ReplaceAll(msgToken, " ", ", ") + "]"
	msgReceiver := strings.Trim(pkt.message.receiver, " ")
	msgReceiver = "[" + strings.ReplaceAll(msgReceiver, " ", ", ") + "]"

	if !malform {
		return fmt.Sprintf("{\\n  version: %s,\\n  sequence: %s ,\\n  "+
			"source: {\\n    chain_id: %s,\\n    addr: %s\\n  },\\n  "+
			"destination: {\\n    chain_id: %s,\\n    addr: %s},\\n  "+
			"message: {\\n    token: %s,\\n    sender: %s,\\n    receiver: %s,\\n    amount: %s\\n  },\\n  "+
			"height: %s\\n}", pkt.version, pkt.sequence, pkt.source.chainID, pkt.source.address,
			pkt.destination.chainID, destAddr, msgToken, pkt.message.sender,
			msgReceiver, pkt.message.amount, pkt.height,
		)
	}

	i := rand.Intn(100)
	if i%2 == 0 { // remove version field
		return fmt.Sprintf("{\\n  sequence: %s ,\\n  "+
			"source: {\\n    chain_id: %s,\\n    addr: %s\\n  },\\n  "+
			"destination: {\\n    chain_id: %s,\\n    addr: %s},\\n  "+
			"message: {\\n    token: %s,\\n    sender: %s,\\n    receiver: %s,\\n    amount: %s\\n  },\\n  "+
			"height: %s\\n}", pkt.sequence, pkt.source.chainID, pkt.source.address,
			pkt.destination.chainID, destAddr, msgToken, pkt.message.sender,
			msgReceiver, pkt.message.amount, pkt.height,
		)
	}
	// empty address: expected to get index error panic catched by
	return fmt.Sprintf("{\\n  version: %s,\\n  sequence: %s ,\\n  "+
		"source: {\\n    chain_id: %s,\\n    addr: %s\\n  },\\n  "+
		"destination: {\\n    chain_id: %s,\\n    addr: %s},\\n  "+
		"message: {\\n    token: %s,\\n    sender: %s,\\n    receiver: %s,\\n    amount: %s\\n  },\\n  "+
		"height: %s\\n}", pkt.version, pkt.sequence, pkt.source.chainID, pkt.source.address,
		pkt.destination.chainID, destAddr, msgToken, pkt.message.sender,
		"", pkt.message.amount, pkt.height,
	)
}

func TestConstructOutMappingKey(t *testing.T) {
	d := uint32(23)
	seqNum := uint64(32)
	expectedString := fmt.Sprintf("{chain_id:%du32,sequence:%du32}", d, seqNum)
	actual := constructOutMappingKey(d, seqNum)
	require.Equal(t, expectedString, actual)
}

func TestConstructEthAddressForAleo(t *testing.T) {
	t.Run("happy path construction", func(t *testing.T) {
		modelEthAddress := "[ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ]"
		ethAddress := ethCommon.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0")
		ethAddrBt := ethAddress.Bytes()
		ethAddrStr := string(ethAddrBt)

		ethAddressForAleo := constructEthAddressForAleoParameter(ethAddrStr)
		assert.Equal(t, modelEthAddress, ethAddressForAleo)
	})
}

func TestParseEthAleoAddress(t *testing.T) {
	t.Run("happy path parsing", func(t *testing.T) {
		modelEthAddress := "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0"
		ethAddrInAleo := "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8"
		ethAddress, err := parseAleoEthAddrToHexString(ethAddrInAleo)
		assert.Nil(t, err)
		assert.Equal(t, modelEthAddress, ethAddress)
	})

	t.Run("wrong address parsing", func(t *testing.T) {
		ethAddrInAleo := "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 aau8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8"
		ethAddress, err := parseAleoEthAddrToHexString(ethAddrInAleo)
		assert.NotNil(t, err)
		assert.Equal(t, "", ethAddress)
	})

	t.Run("wrong address v2: containing extra u8", func(t *testing.T) {
		ethAddrInAleo := "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8"
		ethAddress, err := parseAleoEthAddrToHexString(ethAddrInAleo)
		assert.NotNil(t, err)
		assert.Equal(t, "", ethAddress)
	})

	t.Run("wrong address v3: field length more than required", func(t *testing.T) {
		ethAddrInAleo := "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8"
		ethAddress, err := parseAleoEthAddrToHexString(ethAddrInAleo)
		assert.NotNil(t, err)
		assert.Equal(t, "", ethAddress)
	})

	t.Run("wrong address v4: field length less than required", func(t *testing.T) {
		ethAddrInAleo := "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8"
		ethAddress, err := parseAleoEthAddrToHexString(ethAddrInAleo)
		assert.NotNil(t, err)
		assert.Equal(t, "", ethAddress)
	})
}

func TestParseMessage(t *testing.T) {
	expectedPacket := &aleoPacket{
		version:  "0u8",
		sequence: "1u32",
		source: aleoPacketNetworkAddress{
			chainID: "2u32",
			address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		destination: aleoPacketNetworkAddress{
			chainID: "1u32",
			address: "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8",
		},
		message: aleoMessage{
			token:    "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8",
			sender:   "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			amount:   "102u64",
			receiver: "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8",
		},
		height: "55u32",
	}

	aleoPacket, err := parseMessage(dumpAleoPacket(expectedPacket, false))
	require.NoError(t, err)
	require.Equal(t, expectedPacket, aleoPacket)

	for i := 0; i < 10; i++ {
		aleoPacket, err := parseMessage(dumpAleoPacket(expectedPacket, true))
		require.Error(t, err)
		require.Nil(t, aleoPacket)
	}
}

func TestParseAleoPacket(t *testing.T) {
	t.Run("case: happy test", func(t *testing.T) {
		expectedPacket := chain.Packet{
			Version:  big.NewInt(0),
			Sequence: big.NewInt(1),
			Source: chain.NetworkAddress{
				ChainID: big.NewInt(2),
				Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
			},
			Destination: chain.NetworkAddress{
				ChainID: big.NewInt(01),
				Address: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0", // converting address of form [0u8, 0u8, ..., 176u8] to str
			},
			Message: chain.Message{
				DestTokenAddress: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
				SenderAddress:    "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
				Amount:           big.NewInt(102),
				ReceiverAddress:  "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
			},
			Height: big.NewInt(55),
		}
		s := dumpPktToAleoPacketString(expectedPacket)
		a, err := parseMessage(s)
		require.NoError(t, err)
		commonPacket, err := parseAleoPacket(a)
		require.Nil(t, err)
		require.Equal(t, &expectedPacket, commonPacket)
	})

	t.Run("case: error in parsing", func(t *testing.T) {
		expectedPacket := chain.Packet{
			Version:  big.NewInt(0),
			Sequence: big.NewInt(1),
			Source: chain.NetworkAddress{
				ChainID: big.NewInt(2),
				Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
			},
			Destination: chain.NetworkAddress{
				ChainID: big.NewInt(1),
				Address: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0", // converting address of form [0u8, 0u8, ..., 176u8] to str
			},
			Message: chain.Message{
				DestTokenAddress: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
				SenderAddress:    "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
				Amount:           big.NewInt(102),
				ReceiverAddress:  "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
			},
			Height: big.NewInt(55),
		}
		s := dumpPktToAleoPacketString(expectedPacket)
		a, err := parseMessage(s)
		assert.NoError(t, err)
		errorPackets := []aleoPacket{}
		for i := 0; i < 9; i++ {
			tmp := *a
			switch i {
			case 0:
				tmp.version = "0u6"
				errorPackets = append(errorPackets, tmp)
			case 1:
				tmp.sequence = "0u6"
				errorPackets = append(errorPackets, tmp)
			case 2:
				tmp.source.chainID = "0u6"
				errorPackets = append(errorPackets, tmp)
			case 3:
				tmp.destination.chainID = "0u6"
				errorPackets = append(errorPackets, tmp)
			case 4:
				tmp.destination.address += "u8"
				errorPackets = append(errorPackets, tmp)
			case 5:
				tmp.message.token += "u8"
				errorPackets = append(errorPackets, tmp)
			case 6:
				tmp.message.receiver += "u8"
				errorPackets = append(errorPackets, tmp)
			case 7:
				tmp.message.amount = "0u6"
				errorPackets = append(errorPackets, tmp)
			case 8:
				tmp.height = "0u6"
				errorPackets = append(errorPackets, tmp)
			}

		}
		for _, v := range errorPackets {
			commonPacket, err := parseAleoPacket(&v)
			require.NotNil(t, err)
			require.Nil(t, commonPacket)
		}

	})
}

func TestConstructAleoPacket(t *testing.T) {
	modelAleoPacket := "{ version: 0u8, sequence: 1u32, source: { chain_id: 1u32, addr: [ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ] }, destination: { chain_id: 2u32, addr: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px }, message: { token: aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn, sender: [ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ], receiver: aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn, amount: 102u64 }, height: 55u32 }"
	commonPacket := &chain.Packet{
		Version:  big.NewInt(0),
		Sequence: big.NewInt(1),
		Source: chain.NetworkAddress{
			ChainID: big.NewInt(1),
			Address: string(ethCommon.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0").Bytes()),
		},
		Destination: chain.NetworkAddress{
			ChainID: big.NewInt(2),
			Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", // converting address of form [0u8, 0u8, ..., 176u8] to str
		},
		Message: chain.Message{
			DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			SenderAddress:    string(ethCommon.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0").Bytes()),
			Amount:           big.NewInt(102),
			ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		},
		Height: big.NewInt(55),
	}

	aleoPacket := constructAleoPacket(commonPacket)
	assert.Equal(t, modelAleoPacket, aleoPacket)
}

func dumpPktToAleoPacketString(pkt chain.Packet) string {
	pkt.Destination.Address = string(ethCommon.HexToAddress(pkt.Destination.Address).Bytes())
	pkt.Message.DestTokenAddress = string(ethCommon.HexToAddress(pkt.Message.DestTokenAddress).Bytes())
	pkt.Message.ReceiverAddress = string(ethCommon.HexToAddress(pkt.Message.ReceiverAddress).Bytes())

	return fmt.Sprintf("{\\n  version: %du8,\\n  sequence: %du32 ,\\n  "+
		"source: {\\n    chain_id: %du32,\\n    addr: %s\\n  },\\n  "+
		"destination: {\\n    chain_id: %du32,\\n    addr: %s},\\n  "+
		"message: {\\n    token: %s,\\n    sender: %s,\\n    receiver: %s,\\n    amount: %su64\\n  },\\n  "+
		"height: %du32\\n}", pkt.Version, pkt.Sequence, pkt.Source.ChainID, pkt.Source.Address,
		pkt.Destination.ChainID, constructEthAddressForAleoParameter(pkt.Destination.Address),
		constructEthAddressForAleoParameter(pkt.Message.DestTokenAddress), pkt.Message.SenderAddress,
		constructEthAddressForAleoParameter(pkt.Message.ReceiverAddress), pkt.Message.Amount.String(),
		pkt.Height)
}
