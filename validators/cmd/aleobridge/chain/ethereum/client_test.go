package ethereum

import (
	"context"
	"errors"
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/ethereum/abi"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/config"
)

var (
	cfg = &config.ChainConfig{
		ChainID:        1,
		NodeUrl:        "https://rpc.sepolia.org",
		BridgeContract: "0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758",
		StartHeight:    1,
		WalletPath:     "/home/sheldor/github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/eth_wallet.json",
	}

	modelPacket = struct {
		Version            *big.Int
		Sequence           *big.Int
		SourceTokenService abi.PacketLibraryInNetworkAddress
		DestTokenService   abi.PacketLibraryOutNetworkAddress
		Message            abi.PacketLibraryOutTokenMessage
		Height             *big.Int
	}{
		Version:  big.NewInt(0),
		Sequence: big.NewInt(1),
		SourceTokenService: abi.PacketLibraryInNetworkAddress{
			ChainId: big.NewInt(1),
			Addr:    common.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0"),
		},
		DestTokenService: abi.PacketLibraryOutNetworkAddress{
			ChainId: big.NewInt(2),
			Addr:    "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		Message: abi.PacketLibraryOutTokenMessage{
			SenderAddress:    common.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0"),
			DestTokenAddress: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
			Amount:           big.NewInt(102),
			ReceiverAddress:  "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		Height: big.NewInt(55),
	}
)

func TestNewClientCreation(t *testing.T) {
	t.Run("case: providing name and finality height in config.yaml", func(t *testing.T) {
		cfgNewCl := *cfg
		cfgNewCl.FinalityHeight = 64
		cfgNewCl.Name = "ethereumChain"

		client := NewClient(&cfgNewCl)
		assert.Equal(t, cfgNewCl.Name, client.Name())
		assert.Equal(t, 64, int(client.GetFinalityHeight()))
	})

	t.Run("case: ommitting name and finality height in config.yaml", func(t *testing.T) {
		client := NewClient(cfg)
		assert.Equal(t, ethereum, client.Name())
		assert.Equal(t, defaultFinalityHeight, int(client.GetFinalityHeight()))
	})

	t.Run("case: invalid wallet path", func(t *testing.T) {
		cfgNewCl := *cfg
		cfgNewCl.WalletPath = "ethereumChain"

		assert.Panics(t, func() { NewClient(&cfgNewCl) })
	})

	t.Run("case: invalid node url", func(t *testing.T) {
		cfgNewCl := *cfg
		cfgNewCl.NodeUrl = "ethereumChain"

		assert.Panics(t, func() { NewClient(&cfgNewCl) })
	})
}

type mockBridge struct {
	getPkt func() (struct {
		Version            *big.Int
		Sequence           *big.Int
		SourceTokenService abi.PacketLibraryInNetworkAddress
		DestTokenService   abi.PacketLibraryOutNetworkAddress
		Message            abi.PacketLibraryOutTokenMessage
		Height             *big.Int
	}, error)
}

func (b *mockBridge) OutgoingPackets(opts *bind.CallOpts, arg0 *big.Int, arg1 *big.Int) (struct {
	Version            *big.Int
	Sequence           *big.Int
	SourceTokenService abi.PacketLibraryInNetworkAddress
	DestTokenService   abi.PacketLibraryOutNetworkAddress
	Message            abi.PacketLibraryOutTokenMessage
	Height             *big.Int
}, error) {
	if b.getPkt != nil {
		return b.getPkt()
	}
	return struct {
		Version            *big.Int
		Sequence           *big.Int
		SourceTokenService abi.PacketLibraryInNetworkAddress
		DestTokenService   abi.PacketLibraryOutNetworkAddress
		Message            abi.PacketLibraryOutTokenMessage
		Height             *big.Int
	}{}, errors.New("empty packet")
}

func (b *mockBridge) ReceivePacket(opts *bind.TransactOpts, packet abi.PacketLibraryInPacket) (*types.Transaction, error) {
	return nil, nil
}

func TestGepPktWithSeq(t *testing.T) {
	client := &Client{
		bridge: &mockBridge{
			getPkt: func() (struct {
				Version            *big.Int
				Sequence           *big.Int
				SourceTokenService abi.PacketLibraryInNetworkAddress
				DestTokenService   abi.PacketLibraryOutNetworkAddress
				Message            abi.PacketLibraryOutTokenMessage
				Height             *big.Int
			}, error) {
				return modelPacket, nil
			},
		},
	}
	pkt, err := client.GetPktWithSeq(context.Background(), uint32(1), uint64(1))
	assert.Nil(t, err)
	assert.NotNil(t, pkt)
	assert.Equal(t, pkt.Source.Address, string(modelPacket.SourceTokenService.Addr.Bytes()))
	assert.Equal(t, pkt.Message.SenderAddress, string(modelPacket.Message.SenderAddress.Bytes()))
	assert.Equal(t, pkt.Version, modelPacket.Version.Uint64())
	assert.Equal(t, pkt.Sequence, modelPacket.Sequence.Uint64())
	assert.Equal(t, pkt.Source.ChainID, modelPacket.SourceTokenService.ChainId.Uint64())
	assert.Equal(t, pkt.Destination.ChainID, modelPacket.DestTokenService.ChainId.Uint64())
	assert.Equal(t, pkt.Destination.Address, modelPacket.DestTokenService.Addr)
	assert.Equal(t, chain.Message{
		DestTokenAddress: modelPacket.Message.DestTokenAddress,
		SenderAddress:    string(modelPacket.Message.SenderAddress.Bytes()),
		Amount:           modelPacket.Message.Amount,
		ReceiverAddress:  modelPacket.Message.ReceiverAddress,
	}, pkt.Message)
}
