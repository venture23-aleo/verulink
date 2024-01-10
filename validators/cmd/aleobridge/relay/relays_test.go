package relay

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/config"
)

func getConfig(name, nodeURL, walletPath, contractAddress string, chainID uint32, finalityHeight uint8) *config.ChainConfig {
	return &config.ChainConfig{
		ChainID:        chainID,
		NodeUrl:        nodeURL,
		StartHeight:    1,
		WalletPath:     walletPath,
		BridgeContract: contractAddress,
		Name:           name,
		FinalityHeight: finalityHeight,
	}
}

type mockClient struct {
	name      string
	getChains func() ([]string, error)
}

func (m *mockClient) Name() string {
	return m.name
}
func (m *mockClient) GetFinalityHeight() uint64 {
	return 0
}
func (m *mockClient) GetDestChains() ([]string, error) {
	if m.getChains != nil {
		return m.getChains()
	}
	return nil, errors.New("empty dest")
}
func (m *mockClient) GetChainID() uint32 {
	return 0
}
func (m *mockClient) SendPacket(ctx context.Context, packet *chain.Packet) (err error) {
	return nil
}
func (m *mockClient) IsPktTxnFinalized(ctx context.Context, pkt *chain.Packet) (bool, error) {
	return false, nil
}
func (m *mockClient) GetMinReqBalForMakingTxn() uint64 {
	return 0
}
func (m *mockClient) GetWalletBalance(ctx context.Context) (uint64, error) {
	return 0, nil
}
func (m *mockClient) GetPktWithSeq(ctx context.Context, dst uint32, seqNum uint64) (*chain.Packet, error) {
	return nil, nil
}
func (m *mockClient) CurHeight(ctx context.Context) uint64 {
	return 0
}
func (m *mockClient) GetBlockGenTime() time.Duration {
	return time.Second
}

func TestMultiRelay(t *testing.T) {
	t.Run("case: undefined chain", func(t *testing.T) {
		ethConfig := getConfig("ethereum", "eth.nodeURL.suf", "eth_walletPath.json", "ethContract", uint32(1), uint8(64))
		aleoConfig := getConfig("aleo", "aleo.nodeURL.suf", "aleo_walletPath.json", "aleoContract", uint32(2), uint8(2))

		RegisteredClients["ethereum"] = newMockClient

		configs := []*config.ChainConfig{ethConfig, aleoConfig}

		assert.Panics(t, func() { MultiRelay(context.Background(), configs) })
	})
	t.Run("case: multiple destinations", func(t *testing.T) {
		ethConfig := getConfig("ethereum", "eth.nodeURL.suf", "eth_walletPath.json", "ethContract", uint32(1), uint8(64))
		aleoConfig := getConfig("aleo", "aleo.nodeURL.suf", "aleo_walletPath.json", "aleoContract", uint32(2), uint8(2))
		otherCOnfig := getConfig("other", "other.nodeURL.suf", "other_walletPath.json", "otherContract", uint32(3), uint8(1))

		RegisteredClients["ethereum"] = newMockClient
		RegisteredClients["aleo"] = newMockClient
		RegisteredClients["other"] = newMockClient

		configs := []*config.ChainConfig{ethConfig, aleoConfig, otherCOnfig}

		relays := MultiRelay(context.Background(), configs)
		assert.NotNil(t, relays)
		assert.Equal(t, len(relays), 6)
		chains := makeRelays([]string{"aleo", "ethereum", "other"})
		for _, v := range relays {
			assert.True(t, containsInArray(v.Name(), chains))
		}
	})
	t.Run("case: error while getting dest chains", func(t *testing.T) {
		aleoConfig := getConfig("aleo", "aleo.nodeURL.suf", "aleo_walletPath.json", "aleoContract", uint32(2), uint8(2))
		cfg := getConfig("error", "error.nodeURL.suf", "error_wallet.json", "errorContract", uint32(3), uint8(1))

		configs := []*config.ChainConfig{aleoConfig, cfg}

		assert.Panics(t, func() { MultiRelay(context.Background(), configs) })
	})
}

func containsInArray(str string, arr []string) bool {
	contains := false
	for _, v := range arr {
		if v == str {
			contains = true
			return contains
		}
	}
	return contains
}

func makeRelays(chain []string) []string {
	chains := []string{}
	sourceRelay := chain[0]
	length := len(chain)
	for i := 0; i < length; i++ {
		for j := 1; j < length; j++ {
			chains = append(chains, sourceRelay+"-"+chain[j])
		}
		if i < length-1 {
			sourceRelay = chain[i+1]
			chain[i+1] = chain[0]
			chain[0] = sourceRelay
		}
	}
	return chains
}

type mockRelay struct {
	getName func() string
}

var (
	cancelled = 0
)

func consumeContext(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			cancelled++
			return
		default:
			continue
		}
	}
}

func (mr *mockRelay) Init(ctx context.Context) {
	go consumeContext(ctx)
}
func (mr *mockRelay) Name() string {
	if mr.getName != nil {
		return mr.getName()
	}
	return ""
}

func newMockRelay(name string) Relayer {
	return &mockRelay{
		getName: func() string {
			return name
		},
	}
}

func TestStartMultiRelay(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	relays := Relays{newMockRelay("aleo-ethereum"), newMockRelay("ethereum-aleo")}

	go relays.StartMultiRelay(ctx)
	// TODO: check if go routines started

	time.Sleep(time.Second)
	assert.NotNil(t, chainCtxCncls["aleo-ethereum"])
	assert.NotNil(t, chainCtxCncls["ethereum-aleo"])
}

func newMockClient(cfg *config.ChainConfig) IClient {
	if cfg.Name == "ethereum" {
		return &mockClient{
			name: cfg.Name,
			getChains: func() ([]string, error) {
				return []string{"aleo", "other"}, nil
			},
		}
	} else if cfg.Name == "aleo" {
		return &mockClient{
			name: cfg.Name,
			getChains: func() ([]string, error) {
				return []string{"ethereum", "other"}, nil
			},
		}
	} else if cfg.Name == "other" {
		return &mockClient{
			name: cfg.Name,
			getChains: func() ([]string, error) {
				return []string{"aleo", "ethereum"}, nil
			},
		}
	} else {
		return &mockClient{}
	}
}

func TestChainHandler(t *testing.T) {
	chainCtxMu = sync.Mutex{}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	relays := Relays{newMockRelay("aleo-ethereum"), newMockRelay("ethereum-aleo")}

	go relays.StartMultiRelay(ctx)

	time.Sleep(time.Second)
	assert.NotNil(t, chainCtxCncls["aleo-ethereum"])
	assert.NotNil(t, chainCtxCncls["ethereum-aleo"])

	go chainHandler("aleo-ethereum", ActionType(2))
	go chainHandler("ethereum-aleo", ActionType(2))

	time.Sleep(time.Second)
	assert.Equal(t, cancelled, 2)
	assert.Nil(t, chainCtxCncls["aleo-ethereum"])
	assert.Nil(t, chainCtxCncls["ethereum-aleo"])
}

func TestRelaysHandler(t *testing.T) {
	chainCtxMu = sync.Mutex{}
	ethConfig := getConfig("ethereum", "eth.nodeURL.suf", "eth_walletPath.json", "ethContract", uint32(1), uint8(64))
	aleoConfig := getConfig("aleo", "aleo.nodeURL.suf", "aleo_walletPath.json", "aleoContract", uint32(2), uint8(2))
	chains["aleo"] = newMockClient(aleoConfig)
	chains["ethereum"] = newMockClient(ethConfig)

	relArg := []RelayArg{{"aleo", "ethereum"}, {"ethereum", "aleo"}}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	relays := Relays{newMockRelay("aleo-ethereum"), newMockRelay("ethereum-aleo")}

	go relays.StartMultiRelay(ctx)

	time.Sleep(time.Second)
	assert.NotNil(t, chainCtxCncls["aleo-ethereum"])
	assert.NotNil(t, chainCtxCncls["ethereum-aleo"])

	go relaysHandler(relArg, ActionType(2))
	time.Sleep(time.Second)
	assert.Equal(t, cancelled, 2)
	assert.Nil(t, chainCtxCncls["aleo-ethereum"])
	assert.Nil(t, chainCtxCncls["ethereum-aleo"])
}
