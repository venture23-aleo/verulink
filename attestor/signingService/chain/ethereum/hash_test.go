package ethereum

import (
	"math/big"
	"testing"

	"github.com/stretchr/testify/assert"
	chainService "github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
)

func TestHash(t *testing.T) {
	packet := chainService.Packet{
		Version:  uint8(1),
		Sequence: uint64(1),
		Source: chainService.NetworkAddress{
			ChainID: big.NewInt(2),
			Address: "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27",
		},
		Destination: chainService.NetworkAddress{
			ChainID: big.NewInt(1),
			Address: "0x2D9B1dF35e4fAc995377aD7f7a84070CD36400Ff",
		},
		Message: chainService.Message{
			SenderAddress:    "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27",
			DestTokenAddress: "0xc9788ef51c8deB28F3F205b0B2F124F6884541A4",
			Amount:           big.NewInt(10),
			ReceiverAddress:  "0xBd31ba048373A07bE0357B7Ad3182F4206c8064d",
		},
		Height: uint64(100),
	}
	t.Run("happy path", func(t *testing.T) {
		h := hash(&chainService.ScreenedPacket{Packet: &packet, IsWhite: true})
		assert.Equal(t, "0x01e80e351de9084e68e456b2f9fa18219ffc886f4bfc9e9ad629e5849263bb17", h)
	})
	t.Run("different hash", func(t *testing.T) {
		h := hash(&chainService.ScreenedPacket{Packet: &packet, IsWhite: false})
		assert.Equal(t, "0x4835c896b598a79a62d8ddf852d499ea086b5f9c45d611160cd71758fe9d4ed1", h)
	})

}
