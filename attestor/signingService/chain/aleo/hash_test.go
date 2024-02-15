package aleo

import (
	"math/big"
	"testing"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	chainService "github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
)

func TestHash(t *testing.T) {
	commonPacket := &chainService.Packet{
		Version:  uint8(2),
		Sequence: big.NewInt(1).Uint64(),
		Source: chainService.NetworkAddress{
			ChainID: big.NewInt(1),
			Address: ethCommon.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0").Hex(),
		},
		Destination: chainService.NetworkAddress{
			ChainID: big.NewInt(2),
			Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", // converting address of form [0u8, 0u8, ..., 176u8] to str
		},
		Message: chainService.Message{
			DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			SenderAddress:    ethCommon.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0").Hex(),
			Amount:           big.NewInt(102),
			ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		},
		Height: big.NewInt(55).Uint64(),
	}
	t.Run("happy path", func(t *testing.T) {
		finalHash, err := hash(&chainService.ScreenedPacket{Packet: commonPacket, IsWhite: true})
		require.NoError(t, err)
		assert.Equal(t, "7543830891128583800692794878066685380871013505867763529244695861156504033978field", finalHash)
	})
	t.Run("different hash", func(t *testing.T) {
		finalHash, err := hash(&chainService.ScreenedPacket{Packet: commonPacket, IsWhite: false})
		require.NoError(t, err)
		assert.Equal(t, "1832525342036404857155957536376431929015616821428579010882465763927058667096field", finalHash)
	})
}

func TestConstructAleoPacket(t *testing.T) {
	modelAleoPacket := "{ version: 0u8, sequence: 1u64, source: { chain_id: 1u128, addr: [ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ] }, destination: { chain_id: 2u128, addr: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px }, message: { dest_token_address: aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn, sender_address: [ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ], receiver_address: aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn, amount: 102u128 }, height: 55u64 }"
	commonPacket := &chainService.Packet{
		Version:  uint8(big.NewInt(0).Uint64()),
		Sequence: big.NewInt(1).Uint64(),
		Source: chainService.NetworkAddress{
			ChainID: big.NewInt(1),
			Address: ethCommon.HexToAddress("0X14779F992B2F2C42B8660FFA42DBCB3C7C9930B0").Hex(),
		},
		Destination: chainService.NetworkAddress{
			ChainID: big.NewInt(2),
			Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", // converting address of form [0u8, 0u8, ..., 176u8] to str
		},
		Message: chainService.Message{
			DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			SenderAddress:    ethCommon.HexToAddress("0X14779F992B2F2C42B8660FFA42DBCB3C7C9930B0").Hex(),
			Amount:           big.NewInt(102),
			ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		},
		Height: big.NewInt(55).Uint64(),
	}

	aleoPacket := constructAleoPacket(commonPacket)
	assert.Equal(t, modelAleoPacket, aleoPacket)
}
