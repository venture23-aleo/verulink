package aleo

import (
	"context"
	"math/big"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	aleoRpc "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/aleo/rpc"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/logger"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
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

func TestNewClientCreation(t *testing.T) {
	t.Run("case: providing all the fields in config.yaml", func(t *testing.T) {
		cfgNewCl := *cfg
		cfgNewCl.Name = "aleoChain"
		cfgNewCl.FinalityHeight = uint8(64)
		client := NewClient(&cfgNewCl)

		assert.Equal(t, "aleoChain", client.Name())
		assert.Equal(t, uint64(64), client.GetFinalityHeight())
	})
	t.Run("case: omitting name and finality height in config.yaml", func(t *testing.T) {
		client := NewClient(cfg)
		assert.Equal(t, aleo, client.Name())
		assert.Equal(t, uint64(1), client.GetFinalityHeight())
	})

	t.Run("case: invalid address path", func(t *testing.T) {
		cfgNewCl := *cfg
		cfgNewCl.WalletPath = "aleoChain"

		assert.Panics(t, func() { NewClient(cfg) })
	})

}

func TestGetPktWithSeq(t *testing.T) {
	t.Run("happy path", func(t *testing.T) {
		client := NewClient(cfg)
		mockRpc, _ := aleoRpc.NewMockRPC("nodeurl", "network")
		client.(*Client).aleoClient = mockRpc

		expectedPacket := &chain.Packet{
			Version:  uint64(0),
			Sequence: uint64(1),
			Source: chain.NetworkAddress{
				ChainID: uint64(2),
				Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
			},
			Destination: chain.NetworkAddress{
				ChainID: uint64(1),
				Address: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
			},
			Message: chain.Message{
				DestTokenAddress: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
				SenderAddress:    "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
				Amount:           big.NewInt(102),
				ReceiverAddress:  "0x0000000000000000000000000000000000000000",
			},
			Height: uint64(55),
		}

		pkt, err := client.GetPktWithSeq(context.Background(), uint32(1), uint64(1))
		assert.Nil(t, err)
		assert.Equal(t, expectedPacket, pkt)
	})

	t.Run("case: empty packet error", func(t *testing.T) {
		client := NewClient(cfg)
		mockRpc, _ := aleoRpc.NewMockRPC("nodeurl", "network")
		client.(*Client).aleoClient = mockRpc

		pkt, err := client.GetPktWithSeq(context.Background(), uint32(1), uint64(2))
		assert.NotNil(t, err)
		assert.Nil(t, pkt)
	})
}

func TestSendPacket(t *testing.T) {
	t.Run("happy path", func(t *testing.T) {
		logger.InitLogging(logger.Development, ".")
		client := NewClient(cfg)
		client.(*Client).network = "happynetwork"
		mockRpc, _ := aleoRpc.NewMockRPC("nodeurl", "network")
		client.(*Client).aleoClient = mockRpc

		pktToSend := &chain.Packet{
			Version:  uint64(0),
			Sequence: uint64(1),
			Source: chain.NetworkAddress{
				ChainID: uint64(2),
				Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
			},
			Destination: chain.NetworkAddress{
				ChainID: uint64(1),
				Address: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
			},
			Message: chain.Message{
				DestTokenAddress: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
				SenderAddress:    "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
				Amount:           big.NewInt(102),
				ReceiverAddress:  "0x0000000000000000000000000000000000000000",
			},
			Height: uint64(55),
		}

		err := client.SendPacket(context.Background(), pktToSend)
		assert.Nil(t, err)
	})

	t.Run("case: context time out", func(t *testing.T) {
		logger.InitLogging(logger.Development, ".")
		client := NewClient(cfg)
		client.(*Client).network = "timeout"
		mockRpc, _ := aleoRpc.NewMockRPC("nodeurl", "network")
		client.(*Client).aleoClient = mockRpc

		pktToSend := &chain.Packet{
			Version:  uint64(0),
			Sequence: uint64(1),
			Source: chain.NetworkAddress{
				ChainID: uint64(2),
				Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
			},
			Destination: chain.NetworkAddress{
				ChainID: uint64(1),
				Address: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
			},
			Message: chain.Message{
				DestTokenAddress: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
				SenderAddress:    "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
				Amount:           big.NewInt(102),
				ReceiverAddress:  "0x0000000000000000000000000000000000000000",
			},
			Height: uint64(55),
		}

		err := client.SendPacket(context.Background(), pktToSend)
		assert.ErrorContains(t, err, "signal: killed")
	})

	t.Run("case: misformed/invalid command parameter", func(t *testing.T) {
		logger.InitLogging(logger.Development, ".")
		client := NewClient(cfg)
		client.(*Client).network = "invalidparam"
		mockRpc, _ := aleoRpc.NewMockRPC("nodeurl", "network")
		client.(*Client).aleoClient = mockRpc

		pktToSend := &chain.Packet{
			Version:  uint64(0),
			Sequence: uint64(1),
			Source: chain.NetworkAddress{
				ChainID: uint64(2),
				Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
			},
			Destination: chain.NetworkAddress{
				ChainID: uint64(1),
				Address: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
			},
			Message: chain.Message{
				DestTokenAddress: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
				SenderAddress:    "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
				Amount:           big.NewInt(102),
				ReceiverAddress:  "0x0000000000000000000000000000000000000000",
			},
			Height: uint64(55),
		}

		err := client.SendPacket(context.Background(), pktToSend)
		assert.NotNil(t, err)
	})

	t.Run("case: invalid command", func(t *testing.T) {
		logger.InitLogging(logger.Development, ".")
		client := NewClient(cfg)
		mockRpc, _ := aleoRpc.NewMockRPC("nodeurl", "network")
		client.(*Client).aleoClient = mockRpc

		pktToSend := &chain.Packet{
			Version:  uint64(0),
			Sequence: uint64(1),
			Source: chain.NetworkAddress{
				ChainID: uint64(2),
				Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
			},
			Destination: chain.NetworkAddress{
				ChainID: uint64(1),
				Address: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
			},
			Message: chain.Message{
				DestTokenAddress: "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
				SenderAddress:    "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
				Amount:           big.NewInt(102),
				ReceiverAddress:  "0x0000000000000000000000000000000000000000",
			},
			Height: uint64(55),
		}
		assert.Panics(t, func() { client.SendPacket(context.Background(), pktToSend) })
	})

}
