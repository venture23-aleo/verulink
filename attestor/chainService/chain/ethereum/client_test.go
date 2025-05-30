package ethereum

import (
	"context"
	"errors"
	"math/big"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/venture23-aleo/verulink/attestor/chainService/chain"
	abi "github.com/venture23-aleo/verulink/attestor/chainService/chain/ethereum/abi"
	"github.com/venture23-aleo/verulink/attestor/chainService/config"
	"github.com/venture23-aleo/verulink/attestor/chainService/metrics"
	"github.com/venture23-aleo/verulink/attestor/chainService/store"
)

func setupDB(p string) (func(), error) {
	d := filepath.Dir(p)
	err := os.MkdirAll(d, 0777)
	if err != nil {
		return nil, err
	}
	err = store.InitKVStore(p)
	if err != nil {
		return nil, err
	}
	return func() {
		os.RemoveAll(p)
	}, nil
}

func TestNewClient(t *testing.T) {
	cfg := &config.ChainConfig{
		Name:           "ethereum",
		ChainID:        big.NewInt(1),
		ChainType:      "ethereum",
		BridgeContract: "0x718721F8A5D3491357965190f5444Ef8B3D37553",
		NodeUrl:        "https://rpc.sepolia.org",
		DestChains: map[string]config.PktValidConfig{
			"2": {
				PacketValidityWaitDuration: time.Hour * 24,
				StartHeight:                100,
			},
		},
		StartSeqNum: map[string]uint64{
			"2": 1,
		},
		FilterTopic: "0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9",
	}
	t.Run("happy path", func(t *testing.T) {
		dbRemover, err := setupDB("db")
		assert.NoError(t, err)
		t.Cleanup(dbRemover)
		client := NewClient(cfg)
		assert.Equal(t, client.Name(), "ethereum")
	})

	t.Run("case: invalid node url", func(t *testing.T) {
		dbRemover, err := setupDB("db")
		assert.NoError(t, err)
		t.Cleanup(dbRemover)
		wrongCfg := *cfg
		wrongCfg.NodeUrl = "wrong node url"
		assert.Panics(t, func() { NewClient(&wrongCfg) })
	})
}

func TestNewClientUninitializedDB(t *testing.T) {
	dbRemover, err := setupDB("db")
	assert.NoError(t, err)
	t.Cleanup(dbRemover)
	store.CloseDB()
	cfg := &config.ChainConfig{
		Name:           "ethereum",
		ChainID:        big.NewInt(1),
		ChainType:      "ethereum",
		BridgeContract: "0x718721F8A5D3491357965190f5444Ef8B3D37553",
		NodeUrl:        "https://rpc.sepolia.org",
		DestChains: map[string]config.PktValidConfig{
			"2": {
				PacketValidityWaitDuration: time.Hour * 24,
				StartHeight:                100,
			},
		},
		StartSeqNum: map[string]uint64{
			"2": 1,
		},
		FilterTopic: "0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9",
	}
	t.Run("case: uninitialized database", func(t *testing.T) {
		assert.Panics(t, func() { NewClient(cfg) })
	})
}

type mockEthClient struct {
	getCurHeight func() (uint64, error)
	getLogs      func(height uint64) ([]types.Log, error)
}

func (mckEthCl *mockEthClient) GetCurrentBlock(ctx context.Context) (uint64, error) {
	if mckEthCl.getCurHeight != nil {
		return mckEthCl.getCurHeight()
	}
	return 0, errors.New("error")
}

func (mckEthCl *mockEthClient) FilterLogs(ctx context.Context, fromHeight uint64, toHeight uint64, contractAddress common.Address, topics common.Hash) ([]types.Log, error) {
	if mckEthCl.getLogs != nil {
		return mckEthCl.getLogs(fromHeight)
	}
	return nil, errors.New("error")
}

type mockBridgeClient struct {
	getDispatchedPacket func(logs types.Log) (*abi.BridgePacketDispatched, error)
}

func (mckBridgeCl *mockBridgeClient) ParsePacketDispatched(log types.Log) (*abi.BridgePacketDispatched, error) {
	if mckBridgeCl.getDispatchedPacket != nil {
		return mckBridgeCl.getDispatchedPacket(log)
	}
	return nil, errors.New("error")
}
func newMetrics() *metrics.PrometheusMetrics {
	return metrics.NewPrometheusMetrics()
}

func TestFeedPacket(t *testing.T) {
	pktCh := make(chan *chain.Packet)
	completedCh := make(chan *chain.Packet)
	retryCh := make(chan *chain.Packet)

	client := &Client{
		eth: &mockEthClient{
			getCurHeight: func() (uint64, error) { return 10, nil },
			getLogs:      func(uint64) ([]types.Log, error) { return []types.Log{types.Log{}}, nil },
		},
		bridge: &mockBridgeClient{
			getDispatchedPacket: func(log types.Log) (*abi.BridgePacketDispatched, error) {
				return &abi.BridgePacketDispatched{
					Packet: abi.PacketLibraryOutPacket{
						Version:  common.Big0,
						Sequence: common.Big1,
						SourceTokenService: abi.PacketLibraryInNetworkAddress{
							ChainId: common.Big1,
							Addr:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758"),
						},
						DestTokenService: abi.PacketLibraryOutNetworkAddress{
							ChainId: common.Big2,
							Addr:    "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
						},
						Message: abi.PacketLibraryOutTokenMessage{
							SenderAddress:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758"),
							DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
							Amount:           big.NewInt(100),
							ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
						},
						Height: big.NewInt(55),
					},
				}, nil
			},
		},
		nextBlockHeightMap:        map[string]uint64{common.Big2.String(): 9},
		retryPacketWaitDur:        time.Hour,
		pruneBaseSeqNumberWaitDur: time.Hour,
		feedPktWaitDurMap:         map[string]time.Duration{common.Big2.String(): time.Nanosecond},
		destChainsIDMap:           map[string]bool{common.Big2.String(): true},
		metrics:                   newMetrics(),
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go client.FeedPacket(ctx, pktCh, completedCh, retryCh)

	modelPacket := &chain.Packet{
		Version:  uint8(0),
		Sequence: uint64(1),
		Source: chain.NetworkAddress{
			ChainID: common.Big1,
			Address: common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(),
		},
		Destination: chain.NetworkAddress{
			ChainID: common.Big2,
			Address: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		},
		Message: chain.Message{
			DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			SenderAddress:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(),
			Amount:           big.NewInt(100),
			ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		},
		Height: uint64(55),
	}

	assert.Equal(t, uint64(9), client.nextBlockHeightMap[common.Big2.String()])

	pkt := <-pktCh

	assert.NotNil(t, pkt)
	assert.Equal(t, modelPacket, pkt)
	assert.Equal(t, uint64(11), client.nextBlockHeightMap[common.Big2.String()])
}

func TestInstantFeedPacket(t *testing.T) {
	pktCh := make(chan *chain.Packet)
	completedCh := make(chan *chain.Packet)
	retryCh := make(chan *chain.Packet)

	client := &Client{
		eth: &mockEthClient{
			getCurHeight: func() (uint64, error) { return 11, nil },
			getLogs:      func(uint64) ([]types.Log, error) { return []types.Log{types.Log{}}, nil },
		},
		bridge: &mockBridgeClient{
			getDispatchedPacket: func(log types.Log) (*abi.BridgePacketDispatched, error) {
				return &abi.BridgePacketDispatched{
					Packet: abi.PacketLibraryOutPacket{
						Version:  common.Big3,
						Sequence: common.Big1,
						SourceTokenService: abi.PacketLibraryInNetworkAddress{
							ChainId: common.Big1,
							Addr:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758"),
						},
						DestTokenService: abi.PacketLibraryOutNetworkAddress{
							ChainId: common.Big2,
							Addr:    "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
						},
						Message: abi.PacketLibraryOutTokenMessage{
							SenderAddress:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758"),
							DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
							Amount:           big.NewInt(100),
							ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
						},
						Height: big.NewInt(55),
					},
				}, nil
			},
		},
		nextBlockHeightMap:        map[string]uint64{common.Big2.String(): 9},
		retryPacketWaitDur:        time.Hour,
		pruneBaseSeqNumberWaitDur: time.Hour,
		feedPktWaitDurMap:         map[string]time.Duration{common.Big2.String(): time.Nanosecond},
		destChainsIDMap:           map[string]bool{common.Big2.String(): true},
		metrics:                   newMetrics(),
		chainID:                   common.Big1,
		instantPacketDurationMap:  map[string]time.Duration{common.Big2.String(): time.Nanosecond},
		instantNextBlockHeightMap: map[string]uint64{common.Big2.String(): 9},
		name:                      "chainA",
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go client.FeedPacket(ctx, pktCh, completedCh, retryCh)

	modelPacket := &chain.Packet{
		Version:  uint8(3),
		Sequence: uint64(1),
		Source: chain.NetworkAddress{
			ChainID: common.Big1,
			Address: common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(),
		},
		Destination: chain.NetworkAddress{
			ChainID: common.Big2,
			Address: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		},
		Message: chain.Message{
			DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			SenderAddress:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(),
			Amount:           big.NewInt(100),
			ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		},
		Height:  uint64(55),
		Instant: true,
	}

	assert.Equal(t, uint64(9), client.instantNextBlockHeightMap[common.Big2.String()])

	pkt := <-pktCh

	assert.NotNil(t, pkt)
	assert.Equal(t, modelPacket, pkt)
	assert.Equal(t, uint64(12), client.instantNextBlockHeightMap[common.Big2.String()])
}

func TestRetryFeed(t *testing.T) {
	t.Run("case: retry packets for dstAleo retry packet name spaces", func(t *testing.T) {
		dbRemover, err := setupDB("db")
		assert.NoError(t, err)
		var retryPacketNamespaces []string
		t.Cleanup(func() {
			dbRemover()
			retryPacketNamespaces = nil
		})
		dstAleoNameSpace := retryPacketNamespacePrefix + "_1_" + "2"
		err = store.CreateNamespace(dstAleoNameSpace)
		assert.NoError(t, err)
		retryPacketNamespaces = append(retryPacketNamespaces, dstAleoNameSpace)

		client := &Client{
			retryPacketWaitDur: time.Nanosecond,
			retryPktNamespaces: retryPacketNamespaces,
		}

		// store packet in retry bucket
		modelPacket := &chain.Packet{
			Version:  uint8(0),
			Sequence: uint64(1),
			Source: chain.NetworkAddress{
				ChainID: common.Big1,
				Address: common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(),
			},
			Destination: chain.NetworkAddress{
				ChainID: common.Big2,
				Address: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			},
			Message: chain.Message{
				DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
				SenderAddress:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(),
				Amount:           big.NewInt(100),
				ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			},
			Height: uint64(55),
		}

		for i := 0; i < 10; i++ {
			modelPacket.Sequence = uint64(i + 1)
			store.StoreRetryPacket(dstAleoNameSpace, modelPacket)
		}

		packetCh := make(chan *chain.Packet)

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		go client.retryFeed(ctx, packetCh)

		for i := uint64(1); i <= 10; i++ {
			pkt := <-packetCh
			assert.Equal(t, pkt.Sequence, i)
		}
		cancel()
		time.Sleep(time.Millisecond)
	})

	t.Run("case: retry packets for multiple retry packet name space", func(t *testing.T) {
		dbRemover, err := setupDB("db")
		assert.NoError(t, err)
		var retryPacketNamespaces []string
		t.Cleanup(func() {
			dbRemover()
			retryPacketNamespaces = nil
		})
		dstAleoNameSpace := retryPacketNamespacePrefix + "_1_" + "2"
		dstSolNameSpace := retryPacketNamespacePrefix + "_1_" + "3"
		err = store.CreateNamespaces([]string{dstAleoNameSpace, dstSolNameSpace})
		assert.NoError(t, err)
		retryPacketNamespaces = append(retryPacketNamespaces, dstAleoNameSpace, dstSolNameSpace)

		client := &Client{
			retryPacketWaitDur: time.Nanosecond,
			retryPktNamespaces: retryPacketNamespaces,
		}

		// store packet in retry bucket
		modelPacket := &chain.Packet{
			Version:  uint8(0),
			Sequence: uint64(1),
			Source: chain.NetworkAddress{
				ChainID: common.Big1,
				Address: common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(),
			},
			Destination: chain.NetworkAddress{
				ChainID: common.Big2,
				Address: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			},
			Message: chain.Message{
				DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
				SenderAddress:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(),
				Amount:           big.NewInt(100),
				ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			},
			Height: uint64(55),
		}

		for i := 0; i < 15; i++ {
			modelPacket.Sequence = uint64(i + 1)
			modelPacket.Destination.ChainID = common.Big2
			store.StoreRetryPacket(dstAleoNameSpace, modelPacket)

			modelPacket.Sequence = uint64(i + 1)
			modelPacket.Destination.ChainID = common.Big3
			store.StoreRetryPacket(dstSolNameSpace, modelPacket)
		}

		packetCh := make(chan *chain.Packet)

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()

		go client.retryFeed(ctx, packetCh)

		for i := uint64(1); i <= 20; i++ {
			pkt := <-packetCh
			if i <= 10 {
				assert.Equal(t, pkt.Destination.ChainID.Uint64(), common.Big2.Uint64())
			} else {
				assert.Equal(t, pkt.Destination.ChainID.Uint64(), common.Big3.Uint64())
			}
		}
		for i := uint64(1); i <= 10; i++ {
			pkt := <-packetCh
			if i <= 5 {
				assert.Equal(t, pkt.Destination.ChainID.Uint64(), common.Big2.Uint64())
			} else {
				assert.Equal(t, pkt.Destination.ChainID.Uint64(), common.Big3.Uint64())
			}
		}
		cancel()
		time.Sleep(time.Millisecond)
	})

}

func TestManagePacket(t *testing.T) {
	t.Log("case: manage packet that comes in retry ch")
	completedCh := make(chan *chain.Packet)
	retryCh := make(chan *chain.Packet)

	t.Run("test manage packet for retrynamespace", func(t *testing.T) {
		var retryPacketNamespaces []string
		dbRemover, err := setupDB("db")
		assert.NoError(t, err)
		t.Cleanup(func() {
			dbRemover()
			retryPacketNamespaces = nil
		})

		retryNs := retryPacketNamespacePrefix + "_1_" + "2"
		retryPacketNamespaces = append(retryPacketNamespaces, retryNs)

		namespaces := []string{retryNs}
		err = store.CreateNamespaces(namespaces)
		assert.NoError(t, err)
		client := new(Client)
		client.chainID = common.Big1
		client.name = "ethereum"
		client.SetMetrics(newMetrics())
		client.retryPktNamespaces = retryPacketNamespaces

		// store packet in retry bucket
		modelPacket := &chain.Packet{
			Version:  uint8(0),
			Sequence: uint64(1),
			Source: chain.NetworkAddress{
				ChainID: common.Big1,
				Address: common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(),
			},
			Destination: chain.NetworkAddress{
				ChainID: common.Big2,
				Address: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			},
			Message: chain.Message{
				DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
				SenderAddress:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(),
				Amount:           big.NewInt(100),
				ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			},
			Height: uint64(55),
		}

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		go client.managePacket(ctx, completedCh, retryCh)

		retryCh <- modelPacket
		time.Sleep(time.Second) // wait to fill in the database
		pkt, err := store.RetrieveAndDeleteNPackets(retryNs, 1)
		assert.NoError(t, err)
		assert.Equal(t, pkt[0], modelPacket)
	})

	t.Run("test manage packet for baseSeqNumNamespace", func(t *testing.T) {
		var baseSeqNamespaces []string
		dbRemover, err := setupDB("tmp/test-manage-packet.db")
		require.NoError(t, err)
		t.Cleanup(func() {
			dbRemover()
			baseSeqNamespaces = nil
		})
		bseqNs := baseSeqNumNameSpacePrefix + "_1_" + "2"
		baseSeqNamespaces = append(baseSeqNamespaces, bseqNs)

		namespaces := []string{bseqNs}
		err = store.CreateNamespaces(namespaces)
		assert.NoError(t, err)

		client := new(Client)
		client.SetMetrics(newMetrics())
		client.chainID = common.Big1
		client.name = "ethereum"
		client.baseSeqNamespaces = baseSeqNamespaces
		// store packet in retry bucket
		modelPacket := &chain.Packet{
			Version:  uint8(0),
			Sequence: uint64(1),
			Source: chain.NetworkAddress{
				ChainID: common.Big1,
				Address: common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(),
			},
			Destination: chain.NetworkAddress{
				ChainID: common.Big2,
				Address: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			},
			Message: chain.Message{
				DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
				SenderAddress:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(),
				Amount:           big.NewInt(100),
				ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			},
			Height: uint64(55),
		}

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		go client.managePacket(ctx, completedCh, retryCh)
		completedCh <- modelPacket
		time.Sleep(time.Second) // wait to fill in the database
		exists := store.ExistInGivenNamespace[uint64](bseqNs, modelPacket.Sequence)
		assert.True(t, exists)

		key := store.GetFirstKey[uint64](bseqNs, 1)
		assert.Equal(t, uint64(1), key)
	})
}

func TestPruneBaseSeqNumber(t *testing.T) {
	dbRemover, err := setupDB("tmp/db")
	require.NoError(t, err)
	t.Cleanup(dbRemover)
	var baseSeqNamespaces []string
	var eventLogs []types.Log

	baseSeqNamespaces = append(baseSeqNamespaces, baseSeqNumNameSpacePrefix+"_1_"+"2")
	store.CreateNamespace(baseSeqNamespaces[0])

	client := &Client{
		eth: &mockEthClient{
			getCurHeight: func() (uint64, error) { return 50, nil },
			getLogs:      func(height uint64) ([]types.Log, error) { return eventLogs, nil },
		},
		bridge: &mockBridgeClient{
			getDispatchedPacket: func(log types.Log) (*abi.BridgePacketDispatched, error) {
				return &abi.BridgePacketDispatched{
					Packet: abi.PacketLibraryOutPacket{
						Version:  common.Big0,
						Sequence: big.NewInt(int64(log.BlockNumber)),
						SourceTokenService: abi.PacketLibraryInNetworkAddress{
							ChainId: common.Big1,
							Addr:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758"),
						},
						DestTokenService: abi.PacketLibraryOutNetworkAddress{
							ChainId: common.Big2,
							Addr:    "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
						},
						Message: abi.PacketLibraryOutTokenMessage{
							SenderAddress:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758"),
							DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
							Amount:           big.NewInt(100),
							ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
						},
						Height: big.NewInt(55),
					},
				}, nil
			},
		},
		nextBlockHeightMap:        map[string]uint64{common.Big2.String(): 10},
		retryPacketWaitDur:        time.Hour,
		pruneBaseSeqNumberWaitDur: time.Second,
		metrics:                   newMetrics(),
		baseSeqNamespaces:         baseSeqNamespaces,
		chainID:                   common.Big1,
		name:                      "ethereum",
	}

	for i := 0; i < 15; i++ {
		if i < 10 || i > 12 {
			store.StoreBaseSeqNum(baseSeqNamespaces[0], uint64(i), uint64(i))
		}
	}

	pktCh := make(chan *chain.Packet)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	for i := 10; i < 13; i++ {
		eventLogs = append(eventLogs, types.Log{BlockNumber: uint64(i)})
	}

	go client.pruneBaseSeqNum(ctx, pktCh)

	for i := 10; i < 13; i++ {
		pkt := <-pktCh
		assert.Equal(t, pkt.Sequence, uint64(i))
	}
}
