package relay

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/venture23-aleo/attestor/chainService/chain"
	"github.com/venture23-aleo/attestor/chainService/config"
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

		chainConfigs := []*config.ChainConfig{ethConfig, aleoConfig}
		RegisteredClients["ethereum"] = newMockClient
		cfg := &config.Config{
			ChainConfigs: chainConfigs,
		}

		assert.Panics(t, func() { MultiRelay(context.Background(), cfg) })
	})

	t.Run("case: multiple destinations", func(t *testing.T) {
		ethConfig := getConfig("ethereum", "eth.nodeURL.suf", "eth_walletPath.json", "ethContract", uint32(1), uint8(64))
		aleoConfig := getConfig("aleo", "aleo.nodeURL.suf", "aleo_walletPath.json", "aleoContract", uint32(2), uint8(2))
		otherCOnfig := getConfig("other", "other.nodeURL.suf", "other_walletPath.json", "otherContract", uint32(3), uint8(1))

		RegisteredClients["ethereum"] = newMockClient
		RegisteredClients["aleo"] = newMockClient
		RegisteredClients["other"] = newMockClient

		chainConfigs := []*config.ChainConfig{ethConfig, aleoConfig, otherCOnfig}
		cfg := &config.Config{
			ChainConfigs: chainConfigs,
			BridgePairMap: map[string]map[string]struct{}{
				"ethereum": {"aleo": struct{}{}, "other": struct{}{}},
				"aleo":     {"ethereum": struct{}{}, "other": struct{}{}},
				"other":    {"ethereum": struct{}{}, "aleo": struct{}{}},
			},
		}
		relays := MultiRelay(context.Background(), cfg)
		assert.Equal(t, len(relays), 6)
		chains := map[string]bool{
			"aleo-ethereum":  true,
			"aleo-other":     true,
			"ethereum-other": true,
			"ethereum-aleo":  true,
			"other-aleo":     true,
			"other-ethereum": true,
		}
		for _, v := range relays {
			require.Contains(t, chains, v.Name())
		}
	})

	t.Run("case: error while getting dest chains", func(t *testing.T) {
		aleoConfig := getConfig("aleo", "aleo.nodeURL.suf", "aleo_walletPath.json", "aleoContract", uint32(2), uint8(2))
		cfgWithNoDestChains := getConfig("error", "error.nodeURL.suf", "error_wallet.json", "errorContract", uint32(3), uint8(1))

		chainConfigs := []*config.ChainConfig{aleoConfig, cfgWithNoDestChains}
		cfg := &config.Config{
			ChainConfigs: chainConfigs,
		}
		assert.Panics(t, func() { MultiRelay(context.Background(), cfg) })
	})
}

type mockRelay struct {
	cancelled int
	mu        sync.Mutex
	getName   func() string
}

func consumeContext(ctx context.Context, cancelled *int, mu *sync.Mutex) {
	for {
		select {
		case <-ctx.Done():
			mu.Lock()
			*cancelled++
			mu.Unlock()
			return
		default:
			continue
		}
	}
}

func (mr *mockRelay) Init(ctx context.Context) {
	go consumeContext(ctx, &mr.cancelled, &mr.mu)
}

func (mr *mockRelay) Name() string {
	if mr.getName != nil {
		return mr.getName()
	}
	return ""
}

func newMockRelay(name string) *mockRelay {
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
