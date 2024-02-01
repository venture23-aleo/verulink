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
	"github.com/venture23-aleo/attestor/chainService/chain"
	abi "github.com/venture23-aleo/attestor/chainService/chain/ethereum/abi"
	"github.com/venture23-aleo/attestor/chainService/config"
	_ "github.com/venture23-aleo/attestor/chainService/logger"
	"github.com/venture23-aleo/attestor/chainService/store"
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
		BridgeContract: "0x718721F8A5D3491357965190f5444Ef8B3D37553",
		NodeUrl:        "https://rpc.sepolia.org",
		WaitDuration:   time.Hour * 24,
		DestChains:     []string{"2"},
		StartSeqNum: map[string]uint64{
			"2": 1,
		},
		StartHeight: 100,
		FilterTopic: "0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9",
	}
	t.Run("happy path", func(t *testing.T) {
		dbRemover, err := setupDB("db")
		assert.NoError(t, err)
		t.Cleanup(dbRemover)
		client := NewClient(cfg, map[string]*big.Int{})
		assert.Equal(t, client.Name(), "ethereum")
	})

	t.Run("case: invalid node url", func(t *testing.T) {
		dbRemover, err := setupDB("db")
		assert.NoError(t, err)
		t.Cleanup(dbRemover)
		wrongCfg := *cfg
		wrongCfg.NodeUrl = "wrong node url"
		assert.Panics(t, func() { NewClient(&wrongCfg, map[string]*big.Int{}) })
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
		BridgeContract: "0x718721F8A5D3491357965190f5444Ef8B3D37553",
		NodeUrl:        "https://rpc.sepolia.org",
		WaitDuration:   time.Hour * 24,
		DestChains:     []string{"2"},
		StartSeqNum: map[string]uint64{
			"2": 1,
		},
		StartHeight: 100,
		FilterTopic: "0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9",
	}
	t.Run("case: uninitialized database", func(t *testing.T) {
		assert.Panics(t, func() { NewClient(cfg, map[string]*big.Int{}) })
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

func TestParseBlocks(t *testing.T) {
	t.Logf("case: happy path parsing")

	dbRemover, err := setupDB("db")
	assert.NoError(t, err)
	t.Cleanup(dbRemover)

	client := &Client{
		eth: &mockEthClient{
			getCurHeight: func() (uint64, error) { return 10, nil },
			getLogs:      func(uint64) ([]types.Log, error) { return []types.Log{types.Log{}}, nil },
		},
		bridge: &mockBridgeClient{
			getDispatchedPacket: func(logs types.Log) (*abi.BridgePacketDispatched, error) {
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
	}

	packets, err := client.parseBlock(context.Background(), 10)
	assert.Nil(t, err)
	assert.NotNil(t, packets)
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
	assert.Equal(t, []*chain.Packet{modelPacket}, packets)
}

func TestParseBlocksError(t *testing.T) {
	t.Logf("case: error while filtering packets")
	client := &Client{
		eth: &mockEthClient{
			getCurHeight: func() (uint64, error) { return 10, nil },
		},
		bridge: &mockBridgeClient{},
	}
	packets, err := client.parseBlock(context.Background(), 10)
	assert.Nil(t, packets)
	assert.NotNil(t, err)
}

func TestFeedPacket(t *testing.T) {
	pktCh := make(chan *chain.Packet)

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
		nextBlockHeight:           10,
		retryPacketWaitDur:        time.Hour,
		pruneBaseSeqNumberWaitDur: time.Hour,
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go client.FeedPacket(ctx, pktCh)

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

	assert.Equal(t, uint64(10), client.nextBlockHeight)

	pkt := <-pktCh

	assert.NotNil(t, pkt)
	assert.Equal(t, modelPacket, pkt)
	assert.Equal(t, uint64(11), client.nextBlockHeight)
}

func TestRetryFeed(t *testing.T) {
	cfg := &config.ChainConfig{
		Name:           "ethereum",
		ChainID:        big.NewInt(1),
		BridgeContract: "0x718721F8A5D3491357965190f5444Ef8B3D37553",
		NodeUrl:        "https://rpc.sepolia.org",
		WaitDuration:   time.Hour * 24,
		DestChains:     []string{"2"},
		StartSeqNum: map[string]uint64{
			"2": 1,
		},
		StartHeight: 100,
		FilterTopic: "0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9",
	}
	dbRemover, err := setupDB("db")
	assert.NoError(t, err)
	t.Cleanup(dbRemover)

	client := NewClient(cfg, map[string]*big.Int{})
	assert.Equal(t, client.Name(), "ethereum")

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
			SenderAddress:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(), // TODO: change aleo utils for constructing aleo packet
			Amount:           big.NewInt(100),
			ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		},
		Height: uint64(55),
	}

	for i := 0; i < 10; i++ {
		modelPacket.Sequence = uint64(i + 1)
		store.StoreRetryPacket("ethereum_rpns2", modelPacket)
	}

	packetCh := make(chan *chain.Packet)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go client.(*Client).retryFeed(ctx, packetCh)

	for i := 0; i < 10; i++ {
		pkt := <-packetCh
		assert.Equal(t, pkt.Sequence, uint64(i+1))
	}

	ctx, cancel = context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()

	for {
		select {
		case <-ctx.Done():
			assert.True(t, true)
			return
		case pkt := <-packetCh:
			_ = pkt
			assert.True(t, false)
		}
	}
}

func TestManagePacket(t *testing.T) {
	t.Log("case: manage packet that comes in retry ch")
	cfg := &config.ChainConfig{
		Name:           "ethereum",
		ChainID:        big.NewInt(1),
		BridgeContract: "0x718721F8A5D3491357965190f5444Ef8B3D37553",
		NodeUrl:        "https://rpc.sepolia.org",
		WaitDuration:   time.Hour * 24,
		DestChains:     []string{"2"},
		StartSeqNum: map[string]uint64{
			"2": 1,
		},
		StartHeight: 100,
		FilterTopic: "0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9",
	}
	dbRemover, err := setupDB("db")
	assert.NoError(t, err)
	t.Cleanup(dbRemover)

	client := NewClient(cfg, map[string]*big.Int{})
	assert.Equal(t, client.Name(), "ethereum")

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
			SenderAddress:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(), // TODO: change aleo utils for constructing aleo packet
			Amount:           big.NewInt(100),
			ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		},
		Height: uint64(55),
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go client.(*Client).managePacket(ctx)
	time.Sleep(time.Second) // wait to make the receiver ready before sending
	retryCh <- modelPacket
	time.Sleep(time.Second) // wait to fill in the database
	storedPacket := store.RetrieveNPackets("ethereum_rpns2", 1)
	pkt := <-storedPacket
	assert.Equal(t, pkt, modelPacket)
}

func TestManagePacket2(t *testing.T) {
	t.Log("case: manage packet that comes in completed ch")
	cfg := &config.ChainConfig{
		Name:           "ethereum",
		ChainID:        big.NewInt(1),
		BridgeContract: "0x718721F8A5D3491357965190f5444Ef8B3D37553",
		NodeUrl:        "https://rpc.sepolia.org",
		WaitDuration:   time.Hour * 24,
		DestChains:     []string{"2"},
		StartSeqNum: map[string]uint64{
			"2": 1,
		},
		StartHeight: 100,
		FilterTopic: "0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9",
	}

	client := NewClient(cfg, map[string]*big.Int{})
	assert.Equal(t, client.Name(), "ethereum")

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
			SenderAddress:    common.HexToAddress("0x2Ad6EB85f5Cf1dca10Bc11C31BE923F24adFa758").Hex(), // TODO: change aleo utils for constructing aleo packet
			Amount:           big.NewInt(100),
			ReceiverAddress:  "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		},
		Height: uint64(55),
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go client.(*Client).managePacket(ctx)
	time.Sleep(time.Second) // wait to make the receiver ready before sending
	completedCh <- modelPacket
	time.Sleep(time.Second) // wait to fill in the database
	exists := store.ExistInGivenNamespace[uint64](baseSeqNumNameSpacePrefix+modelPacket.Destination.ChainID.String(), modelPacket.Sequence)
	assert.True(t, exists)

	key := store.GetFirstKey[uint64](baseSeqNumNameSpacePrefix+modelPacket.Destination.ChainID.String(), 1)
	assert.Equal(t, uint64(1), key)
}

func TestPruneBaseSeqNumber(t *testing.T) {
	dbRemover, err := setupDB("tmp/db")
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	client := &Client{
		eth: &mockEthClient{
			getCurHeight: func() (uint64, error) { return 50, nil },
			getLogs:      func(height uint64) ([]types.Log, error) { return []types.Log{types.Log{BlockNumber: height}}, nil },
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
		nextBlockHeight:           10,
		retryPacketWaitDur:        time.Hour,
		pruneBaseSeqNumberWaitDur: time.Second,
		waitDur:                   time.Second,
	}

	baseSeqNamespaces = append(baseSeqNamespaces, baseSeqNumNameSpacePrefix+"2")
	store.CreateNamespace(baseSeqNamespaces[0])

	for i := 0; i < 15; i++ {
		if i < 10 || i > 12 {
			store.StoreBaseSeqNum(baseSeqNamespaces[0], uint64(i), uint64(i))
		}
	}

	pktCh := make(chan *chain.Packet)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go client.pruneBaseSeqNum(ctx, pktCh)

	for i := 10; i < 13; i++ {
		pkt := <-pktCh
		assert.Equal(t, pkt.Sequence, uint64(i))
	}
}
