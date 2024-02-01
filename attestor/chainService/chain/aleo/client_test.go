package aleo

import (
	"context"
	"errors"
	"math/big"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	_ "github.com/venture23-aleo/attestor/chainService/logger"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/venture23-aleo/attestor/chainService/chain"
	"github.com/venture23-aleo/attestor/chainService/chain/aleo/rpc"
	"github.com/venture23-aleo/attestor/chainService/config"
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
		Name:           "aleo",
		ChainID:        big.NewInt(1),
		BridgeContract: "0x718721F8A5D3491357965190f5444Ef8B3D37553",
		NodeUrl:        "https://node.url|testnet3",
		WaitDuration:   time.Hour * 24,
		DestChains:     []string{"1"},
		StartSeqNum: map[string]uint64{
			"2": 1,
		},
		StartHeight: 100,
		FilterTopic: "0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9",
	}
	t.Run("happy path", func(t *testing.T) {
		dbRemover, err := setupDB("db")
		require.NoError(t, err)
		t.Cleanup(dbRemover)

		client := NewClient(cfg, map[string]*big.Int{"2": big.NewInt(2)})
		assert.Equal(t, client.Name(), "aleo")
	})

	t.Run("case: invalid node url", func(t *testing.T) {
		dbRemover, err := setupDB("db")
		require.NoError(t, err)
		t.Cleanup(dbRemover)

		wrongCfg := *cfg
		wrongCfg.NodeUrl = "wrong node url"
		assert.Panics(t, func() { NewClient(&wrongCfg, map[string]*big.Int{}) })
	})
}

func TestNewClientUninitializedDB(t *testing.T) {
	dbRemover, err := setupDB("db")
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	store.CloseDB()
	cfg := &config.ChainConfig{
		Name:           "aleo",
		ChainID:        big.NewInt(2),
		BridgeContract: "0x718721F8A5D3491357965190f5444Ef8B3D37553",
		NodeUrl:        "https://node.url|testnet3",
		WaitDuration:   time.Hour * 24,
		DestChains:     []string{"1"},
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

type mockAleoClient struct {
	getPkt func(key string) (map[string]string, error)
}

func (mckAleoCl *mockAleoClient) FindTransactionIDByProgramID(ctx context.Context, programId string) (string, error) {
	return "", nil
}
func (mckAleoCl *mockAleoClient) GetMappingValue(ctx context.Context, programId, mappingName, mappingKey string) (map[string]string, error) {
	if mckAleoCl.getPkt != nil {
		return mckAleoCl.getPkt(mappingKey)
	}
	return nil, errors.New("error")
}
func (mckAleoCl *mockAleoClient) GetMappingNames(ctx context.Context, programId string) ([]string, error) {
	return nil, nil
}
func (mckAleoCl *mockAleoClient) GetTransactionById(ctx context.Context, transactionId string) (*rpc.Transaction, error) {
	return nil, nil
}
func (mckAleoCl *mockAleoClient) GetLatestHeight(ctx context.Context) (int64, error) {
	return 0, nil
}
func (mckAleoCl *mockAleoClient) Send(ctx context.Context, aleoPacket, privateKey, queryUrl, network, priorityFee string) *exec.Cmd {
	return nil
}

func TestFeedPacket(t *testing.T) {
	t.Log("case: happy path parsing")

	aleoPacket := &aleoPacket{
		version:  "0u8",
		sequence: "1u64",
		source: aleoPacketNetworkAddress{
			chainID: "2u128",
			address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		destination: aleoPacketNetworkAddress{
			chainID: "1u128",
			address: "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8",
		},
		message: aleoMessage{
			token:    "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8",
			sender:   "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			amount:   "102u64",
			receiver: "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8",
		},
		height: "55u64",
	}

	expectedPacket := &chain.Packet{
		Version:  uint8(0),
		Sequence: uint64(1),
		Source: chain.NetworkAddress{
			ChainID: big.NewInt(2),
			Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		Destination: chain.NetworkAddress{
			ChainID: big.NewInt(1),
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

	aleoPacketString := dumpAleoPacket(aleoPacket, false)

	dstChainId := big.NewInt(1).String()

	client := &Client{
		aleoClient: &mockAleoClient{
			getPkt: func(key string) (map[string]string, error) {
				if key == "{chain_id:1u128,sequence:1u64}" {
					m := make(map[string]string)
					m[key] = aleoPacketString
					return m, nil
				}
				return nil, errors.New("error")
			},
		},
		retryPacketWaitDur:  time.Hour,
		destChains:          map[string]uint64{dstChainId: uint64(1)},
		pruneBaseSeqWaitDur: time.Hour,
	}
	pktCh := make(chan *chain.Packet)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go client.FeedPacket(ctx, pktCh)

	assert.Equal(t, client.destChains[dstChainId], uint64(1))

	pkt := <-pktCh
	assert.Equal(t, pkt, expectedPacket)
	assert.Equal(t, client.destChains[dstChainId], uint64(2))
}

func TestRetryFeed(t *testing.T) {
	dbRemover, err := setupDB("db")
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	client := &Client{
		retryPacketWaitDur:  time.Second,
		pruneBaseSeqWaitDur: time.Hour,
	}

	store.CreateNamespaces([]string{retryPacketNamespacePrefix + "1", baseSeqNumNameSpacePrefix + "1"})
	retryPacketNamespaces = append(retryPacketNamespaces, retryPacketNamespacePrefix+"1")

	// store packet in retry bucket
	modelPacket := &chain.Packet{
		Version:  uint8(0),
		Sequence: uint64(1),
		Source: chain.NetworkAddress{
			ChainID: big.NewInt(2),
			Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		Destination: chain.NetworkAddress{
			ChainID: big.NewInt(1),
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

	for i := 0; i < 10; i++ {
		modelPacket.Sequence = uint64(i + 1)
		store.StoreRetryPacket("aleo_rpns1", modelPacket)
	}

	packetCh := make(chan *chain.Packet)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go client.retryFeed(ctx, packetCh)

	for i := 1; i <= 10; i++ {
		pkt := <-packetCh
		assert.Equal(t, pkt.Sequence, uint64(i))
	}

	ctx, cancel = context.WithTimeout(context.Background(), time.Second*2)
	defer cancel()

	for {
		select {
		case <-ctx.Done():
			return
		case <-packetCh:
			assert.FailNow(t, "fail")
		}
	}

}

func TestManagePacket(t *testing.T) {
	t.Log("case: manage packet that comes in retry ch")
	dbRemover, err := setupDB("tmp/db")
	require.NoError(t, err)
	t.Cleanup(dbRemover)
	client := &Client{
		retryPacketWaitDur:  time.Hour,
		pruneBaseSeqWaitDur: time.Hour,
	}

	store.CreateNamespaces([]string{retryPacketNamespacePrefix + "1", baseSeqNumNameSpacePrefix + "1"})

	// store packet in retry bucket
	modelPacket := &chain.Packet{
		Version:  uint8(0),
		Sequence: uint64(1),
		Source: chain.NetworkAddress{
			ChainID: big.NewInt(2),
			Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		Destination: chain.NetworkAddress{
			ChainID: big.NewInt(1),
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
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go client.managePacket(ctx)
	retryCh <- modelPacket
	time.Sleep(time.Millisecond * 10) // wait to fill in the database
	pkts, err := store.RetrieveAndDeleteNPackets("aleo_rpns1", 1)
	assert.NoError(t, err)
	assert.Len(t, pkts, 1)
	assert.Equal(t, pkts[0], modelPacket)
}

func TestManagePacket2(t *testing.T) {
	t.Log("case: manage packet that comes in completed ch")
	dbRemover, err := setupDB("tmp/db")
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	client := &Client{
		retryPacketWaitDur:  time.Hour,
		pruneBaseSeqWaitDur: time.Hour,
	}

	err = store.CreateNamespaces([]string{retryPacketNamespacePrefix + "1", baseSeqNumNameSpacePrefix + "1"})
	assert.NoError(t, err)

	// store packet in retry bucket
	modelPacket := &chain.Packet{
		Version:  uint8(0),
		Sequence: uint64(1),
		Source: chain.NetworkAddress{
			ChainID: big.NewInt(2),
			Address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		Destination: chain.NetworkAddress{
			ChainID: big.NewInt(1),
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

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go client.managePacket(ctx)

	completedCh <- modelPacket
	time.Sleep(time.Millisecond * 10) // wait to fill in the database
	exists := store.ExistInGivenNamespace(
		baseSeqNumNameSpacePrefix+modelPacket.Destination.ChainID.String(), modelPacket.Sequence)
	assert.True(t, exists)

	key := store.GetFirstKey[uint64](baseSeqNumNameSpacePrefix+modelPacket.Destination.ChainID.String(), 1)
	assert.Equal(t, uint64(1), key)
}

func TestPruneBaseSeqNumber(t *testing.T) {
	aleoPacket := &aleoPacket{
		version:  "0u8",
		sequence: "10u64",
		source: aleoPacketNetworkAddress{
			chainID: "2u128",
			address: "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
		},
		destination: aleoPacketNetworkAddress{
			chainID: "1u128",
			address: "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8",
		},
		message: aleoMessage{
			token:    "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8",
			sender:   "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			amount:   "102u64",
			receiver: "0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 0u8 20u8 119u8 159u8 153u8 43u8 47u8 44u8 66u8 184u8 102u8 15u8 250u8 66u8 219u8 203u8 60u8 124u8 153u8 48u8 176u8",
		},
		height: "55u64",
	}

	dbRemover, err := setupDB("tmp/db")
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	client := &Client{
		aleoClient: &mockAleoClient{
			getPkt: func(key string) (map[string]string, error) {
				keySplit := strings.Split(key, ",")
				key1Split := strings.Split(keySplit[1], ":")
				sequence := strings.ReplaceAll(key1Split[1], "}", "")
				aleoPacket.sequence = sequence
				aleoPacketString := dumpAleoPacket(aleoPacket, false)
				m := make(map[string]string)
				m[key] = aleoPacketString
				return m, nil
			},
		},
		retryPacketWaitDur:  time.Hour,
		destChains:          map[string]uint64{big.NewInt(1).String(): 1},
		pruneBaseSeqWaitDur: time.Second,
	}

	baseSeqNamespaces = append(baseSeqNamespaces, baseSeqNumNameSpacePrefix+"1")
	store.CreateNamespace(baseSeqNamespaces[0])

	for i := 0; i < 15; i++ {
		if i < 10 || i > 12 {
			store.StoreBaseSeqNum(baseSeqNamespaces[0], uint64(i), 0)
		}
	}

	pktCh := make(chan *chain.Packet)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go client.pruneBaseSeqNum(ctx, pktCh)

	for i := 9; i < 13; i++ {
		pkt := <-pktCh
		assert.Equal(t, pkt.Sequence, uint64(i))
	}
}
