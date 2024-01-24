package aleo

import (
	"fmt"
	"math/big"
	"testing"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/venture23-aleo/attestor/chainService/chain"
)

func TestHash(t *testing.T) {
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
	finalHash := hash(&chain.ScreenedPacket{Packet: commonPacket, IsWhite: true})
	fmt.Println(finalHash)
}
