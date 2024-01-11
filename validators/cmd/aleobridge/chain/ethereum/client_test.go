package ethereum

import (
	"context"
	"errors"
	"math/big"
	"os"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/ethereum/abi"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/config"
)

const (
	rpcEndpoint = "https://rpc.sepolia.org"
	walletConfigFile = "ethWallet.json"
	ethWalletName = "eth_wallet.json"
)

func getConfig(name, nodeURL string, finalityHeight uint8) *config.ChainConfig {
	return &config.ChainConfig{
		ChainID:        2,
		NodeUrl:        nodeURL,
		StartHeight:    1,
		WalletPath:     "eth_wallet.json",
		BridgeContract: "bridge.aleo",
		Name:           name,
		FinalityHeight: finalityHeight,
	}
}

func createEthereumWallet() (string, string) {
	os.WriteFile(walletConfigFile, []byte(`{
		"private_key": "hello",
		"ks_path": "eth_wallet.json",
		"coin_type": "ETH"
	}`), 0660)
	os.WriteFile(ethWalletName, []byte(`{"address":"3bbe4b23aafa2a8cd3b89c6aa5298d02681a99d4","crypto":{"cipher":"aes-128-ctr","ciphertext":"dca9be12d96dd6d0c107d917585613807110e06ce4cb42720d5fb05c211d6c6b","cipherparams":{"iv":"208b124ccd5963cff6ed4c245c97f205"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"023fdeed8823d375146fcefb60dfe02723a8ec58278d14888b9e2fb17e8954a2"},"mac":"94af4320cfba7d95ce7286ac86129be016a3d184f377971bd489827b170acad1"},"id":"aea8d006-cdd7-4e56-b5e4-da32aad315a2","version":3}`), 0660)
	return walletConfigFile, ethWalletName
}

var (
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

	modelSendPacket = &chain.Packet{
		Version:  uint64(0),
		Sequence: uint64(1),
		Source: chain.NetworkAddress{
			ChainID: uint64(2),
			Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		Destination: chain.NetworkAddress{
			ChainID: uint64(1),
			Address: string(common.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0").Bytes()),
		},
		Message: chain.Message{
			DestTokenAddress: string(common.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0").Bytes()),
			SenderAddress:    "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			Amount:           big.NewInt(102),
			ReceiverAddress:  string(common.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0").Bytes()),
		},
		Height: uint64(55),
	}
)

func TestNewClientCreation(t *testing.T) {
	t.Run("case: providing name and finality height in config.yaml", func(t *testing.T) {
		walletConfig, ethWallet := createEthereumWallet()
		defer func() {
			err := os.Remove(walletConfig)
			assert.Nil(t, err)
			err = os.Remove(ethWallet)
			assert.Nil(t, err)
		}()
		cfgNewCl := getConfig("ethereumchain", rpcEndpoint, 64)

		client := NewClient(cfgNewCl)
		assert.Equal(t, cfgNewCl.Name, client.Name())
		assert.Equal(t, 64, int(client.GetFinalityHeight()))
	})

	t.Run("case: ommitting name and finality height in config.yaml", func(t *testing.T) {
		walletConfig, ethWallet := createEthereumWallet()
		defer func() {
			err := os.Remove(walletConfig)
			assert.Nil(t, err)
			err = os.Remove(ethWallet)
			assert.Nil(t, err)
		}()
		cfgNewCl := getConfig("", rpcEndpoint, 0)

		client := NewClient(cfgNewCl)
		assert.Equal(t, ethereum, client.Name())
		assert.Equal(t, defaultFinalityHeight, int(client.GetFinalityHeight()))
	})

	t.Run("case: invalid wallet path", func(t *testing.T) {
		cfgNewCl := getConfig("ethereumchain", rpcEndpoint, 64)

		assert.Panics(t, func() { NewClient(cfgNewCl) })
		assert.Panics(t, func() { NewClient(cfgNewCl) })
	})

	t.Run("case: invalid node url", func(t *testing.T) {
		walletConfig, ethWallet := createEthereumWallet()
		defer func() {
			err := os.Remove(walletConfig)
			assert.Nil(t, err)
			err = os.Remove(ethWallet)
			assert.Nil(t, err)
		}()
		cfgNewCl := getConfig("ethereumchain", rpcEndpoint+"invalid string", 64)

		assert.Panics(t, func() { NewClient(cfgNewCl) })
		assert.Panics(t, func() { NewClient(cfgNewCl) })
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
	sendPkt func(ctx context.Context) (*types.Transaction, error)
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
	if b.sendPkt != nil {
		return b.sendPkt(opts.Context)
	}
	return nil, errors.New("error in sending packet")
}

func TestGetPktWithSeq(t *testing.T) {
	t.Run("case: happy path", func(t *testing.T) {
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
	})

	t.Run("case: error while receiving packet", func(t *testing.T) {
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
					return struct {
						Version            *big.Int
						Sequence           *big.Int
						SourceTokenService abi.PacketLibraryInNetworkAddress
						DestTokenService   abi.PacketLibraryOutNetworkAddress
						Message            abi.PacketLibraryOutTokenMessage
						Height             *big.Int
					}{}, errors.New("emptyPacket")
				},
			},
		}
		pkt, err := client.GetPktWithSeq(context.Background(), uint32(1), uint64(1))
		assert.NotNil(t, err)
		assert.Nil(t, pkt)
	})
}

func TestSendPacket(t *testing.T) {
	walletConfig, ethWallet := createEthereumWallet()
		defer func() {
			err := os.Remove(walletConfig)
			assert.Nil(t, err)
			err = os.Remove(ethWallet)
			assert.Nil(t, err)
		}()
	wallet, _ := loadWalletConfig(walletConfig)
	ethcl, _ := ethclient.Dial(rpcEndpoint)
	t.Run("case: happy send", func(t *testing.T) {
		client := &Client{
			bridge: &mockBridge{
				sendPkt: func(ctx context.Context) (t *types.Transaction, err error) {
					address := common.HexToAddress("0x14779F992B2F2c42b8660Ffa42DBcb3C7C9930B0")
					baseTx := &types.LegacyTx{
						To:       &address,
						Nonce:    0,
						GasPrice: big.NewInt(defaultGasPrice),
						Gas:      defaultGasLimit,
						Value:    common.Big0,
						Data:     []byte{},
					}
					return types.NewTx(baseTx), nil
				},
			},
			wallet: wallet,
			eth:    ethcl,
		}

		err := client.SendPacket(context.Background(), modelSendPacket)
		assert.Nil(t, err)
	})

	t.Run("case: context times out", func(t *testing.T) {
		wallet, _ := loadWalletConfig(walletConfig)
		ethcl, _ := ethclient.Dial(rpcEndpoint)
		client := &Client{
			bridge: &mockBridge{
				sendPkt: func(ctx context.Context) (*types.Transaction, error) {
					return nil, errors.New("context cancelled")
				},
			},
			wallet:          wallet,
			eth:             ethcl,
			sendPktDuration: time.Second * 5,
		}
		err := client.SendPacket(context.Background(), modelSendPacket)
		assert.NotNil(t, err)

	})
}
