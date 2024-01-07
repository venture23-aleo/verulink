package aleo

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"os/exec"
	"testing"
	"time"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/aleo/rpc"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/config"
)

const (
	RpcEndpoint = "3.84.49.97"
)

var (
	cfg = &config.ChainConfig{
		ChainID:        2,
		NodeUrl:        "http://" + RpcEndpoint + "|testnet3",
		BridgeContract: "bridge.aleo",
		StartHeight:    1,
		WalletPath:     "/home/sheldor/github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/aleo_wallet.json",
	}

	modelPacket = &chain.Packet{
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
			ReceiverAddress:  "0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0",
		},
		Height: uint64(55),
	}
)

func dumpToAleoPacketString(pkt chain.Packet) string {
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

func giveOutPackets(key string, seq uint64) (map[string]string, error) {
	packetString := dumpToAleoPacketString(*modelPacket)
	return map[string]string{key: packetString}, nil
}

type mockRpc struct {
	getPkt  func() (map[string]string, error)
	sendPkt func(ctx context.Context) *exec.Cmd
}

func (r *mockRpc) FindTransactionIDByProgramID(ctx context.Context, programId string) (string, error) {
	return "", nil
}
func (r *mockRpc) GetMappingValue(ctx context.Context, programId, mappingName, mappingKey string) (map[string]string, error) {
	if r.getPkt != nil {
		return r.getPkt()
	}
	return nil, errors.New("empty packet")
}
func (r *mockRpc) GetMappingNames(ctx context.Context, programId string) ([]string, error) {
	return nil, nil
}
func (r *mockRpc) GetTransactionById(ctx context.Context, transactionId string) (*rpc.Transaction, error) {
	return nil, nil
}
func (r *mockRpc) GetLatestHeight(ctx context.Context) (int64, error) {
	return 0, nil
}
func (r *mockRpc) Send(ctx context.Context, aleoPacket, privateKey, queryUrl, network, priorityFee string) *exec.Cmd {
	if r.sendPkt != nil {
		return r.sendPkt(ctx)
	}
	return nil
}

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

		assert.Panics(t, func() { NewClient(&cfgNewCl) })
	})

}

func TestGetPktWithSeq(t *testing.T) {
	t.Run("happy path", func(t *testing.T) {
		client := &Client{
			aleoClient: &mockRpc{
				getPkt: func() (map[string]string, error) {
					return giveOutPackets(constructOutMappingKey(uint32(1), uint64(1)), uint64(1))
				},
			},
		}

		pkt, err := client.GetPktWithSeq(context.Background(), uint32(1), uint64(1))
		assert.Nil(t, err)

		expectedPacket := *modelPacket
		assert.Equal(t, &expectedPacket, pkt)
	})

	t.Run("case: empty packet error", func(t *testing.T) {
		client := &Client{
			aleoClient: &mockRpc{},
		}

		pkt, err := client.GetPktWithSeq(context.Background(), uint32(1), uint64(2))
		assert.NotNil(t, err)
		assert.Nil(t, pkt)
	})
}

func TestSendPacket(t *testing.T) {
	t.Run("happy path", func(t *testing.T) {
		wallet, _ := loadWalletConfig(cfg.WalletPath)
		client := &Client{
			wallet: wallet,
			aleoClient: &mockRpc{
				sendPkt: func(ctx context.Context) *exec.Cmd {
					cmd := exec.CommandContext(ctx, "sleep", "5")
					return cmd
				},
			},
			sendPktDur: time.Minute,
		}
		pktToSend := *modelPacket
		err := client.SendPacket(context.Background(), &pktToSend)
		assert.Nil(t, err)
	})

	t.Run("case: context time out", func(t *testing.T) {
		wallet, _ := loadWalletConfig(cfg.WalletPath)
		client := &Client{
			wallet: wallet,
			aleoClient: &mockRpc{
				sendPkt: func(ctx context.Context) *exec.Cmd {
					cmd := exec.CommandContext(ctx, "sleep", "5")
					return cmd
				},
			},
			sendPktDur: time.Second,
		}

		pktToSend := *modelPacket
		err := client.SendPacket(context.Background(), &pktToSend)
		assert.ErrorContains(t, err, "signal: killed")
	})

	t.Run("case: misformed/invalid command parameter", func(t *testing.T) {
		wallet, _ := loadWalletConfig(cfg.WalletPath)
		client := &Client{
			wallet: wallet,
			aleoClient: &mockRpc{
				sendPkt: func(ctx context.Context) *exec.Cmd {
					cmd := exec.CommandContext(ctx, "sleep", "5po")
					return cmd
				},
			},
			sendPktDur: time.Second,
		}

		pktToSend := *modelPacket
		err := client.SendPacket(context.Background(), &pktToSend)
		assert.NotNil(t, err)
	})

	t.Run("case: invalid command", func(t *testing.T) {
		wallet, _ := loadWalletConfig(cfg.WalletPath)
		client := &Client{
			wallet: wallet,
			aleoClient: &mockRpc{
				sendPkt: func(ctx context.Context) *exec.Cmd {
					cmd := exec.CommandContext(ctx, "sleep", "5")
					return cmd
				},
			},
			sendPktDur: time.Second,
		}

		pktToSend := *modelPacket
		err := client.SendPacket(context.Background(), &pktToSend)
		assert.NotNil(t, err)
	})

}
