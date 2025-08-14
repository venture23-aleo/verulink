package ethereum

import (
	"math/big"
	"testing"

	"github.com/stretchr/testify/assert"
	chainService "github.com/venture23-aleo/verulink/attestor/chainService/chain"
)

func TestHash(t *testing.T) {
	packet := chainService.Packet{
		Version:  uint8(1),
		Sequence: uint64(16),
		Source: chainService.NetworkAddress{
			ChainID: big.NewInt(6694886634403),
			Address: "aleo1ekhz75ffmguxcux7czmkry0ycrl4uwugcqc0qagn2y2qhm33lcpq74kmww",
		},
		Destination: chainService.NetworkAddress{
			ChainID: big.NewInt(422842677857),
			Address: "0x29E9C4a930A8360364116aC931D0606A8f634524",
		},
		Message: chainService.Message{
			SenderAddress:    "aleo1ekhz75ffmguxcux7czmkry0ycrl4uwugcqc0qagn2y2qhm33lcpq74kmww",
			DestTokenAddress: "0x0c1F973927B2D1403727977E8b3Da8A42d640AC0",
			Amount:           big.NewInt(18000000),
			ReceiverAddress:  "0x0C9119f08cF3361c3F3abbBC593a1CE2e63068f7",
		},
		Height: uint64(9987503),
	}
	t.Run("happy path", func(t *testing.T) {
		h := hash(&chainService.ScreenedPacket{Packet: &packet, IsWhite: true})
		assert.Equal(t, "0x5fed48e10cfa0f4922d33b2e9addfa84155ea79ad1ed84ea97280fdb941da6f4", h)
	})
	t.Run("different hash", func(t *testing.T) {
		h := hash(&chainService.ScreenedPacket{Packet: &packet, IsWhite: false})
		assert.Equal(t, "0x309007e3505b01cf3b58996f75091ec4ef7d3316d6218b687a8578a9d9aef126", h)
	})
}
