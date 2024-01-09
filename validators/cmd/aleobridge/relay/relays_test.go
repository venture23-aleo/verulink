package relay

import (
	"context"
	"errors"
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

type MockClient struct {
	getChains func() ([]string, error)
}

func (m *MockClient) Name() string              { return "" }
func (m *MockClient) GetFinalityHeight() uint64 { return 0 }
func (m *MockClient) GetDestChains() ([]string, error) {
	if m.getChains != nil {
		return m.getChains()
	}
	return nil, errors.New("empty dest")
}
func (m *MockClient) GetChainID() uint32                                               { return 0 }
func (m *MockClient) SendPacket(ctx context.Context, packet *chain.Packet) (err error) { return nil }
func (m *MockClient) IsPktTxnFinalized(ctx context.Context, pkt *chain.Packet) (bool, error) {
	return false, nil
}
func (m *MockClient) GetMinReqBalForMakingTxn() uint64                     { return 0 }
func (m *MockClient) GetWalletBalance(ctx context.Context) (uint64, error) { return 0, nil }
func (m *MockClient) GetPktWithSeq(ctx context.Context, dst uint32, seqNum uint64) (*chain.Packet, error) {
	return nil, nil
}
func (m *MockClient) CurHeight(ctx context.Context) uint64 { return 0 }
func (m *MockClient) GetBlockGenTime() time.Duration       { return time.Second }

func TestMultiRelay(t *testing.T) {
	t.Run("case: happy test", func(t *testing.T) {
		ethConfig := getConfig("ethereum", "eth.nodeURL.suf", "eth_walletPath.json", "ethContract", uint32(1), uint8(64))
		aleoConfig := getConfig("aleo", "aleo.nodeURL.suf", "aleo_walletPath.json", "aleoContract", uint32(2), uint8(2))

		RegisteredClients["ethereum"] = newMockClient
		RegisteredClients["aleo"] = newMockClient

		configs := []*config.ChainConfig{ethConfig, aleoConfig}

		relays := MultiRelay(context.Background(), configs)
		assert.NotNil(t, relays)
		assert.Equal(t, len(relays), 2)
	})
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
	})
}

type mockRelay struct {
	getName func() string 
}

func (mr *mockRelay) Init(ctx context.Context){}
func (mr *mockRelay) Name() string {
	if mr.getName != nil {
		return mr.getName()
	}
	return ""
}

func newMockRelay(name string) Relayer{
	return &mockRelay{
		getName: func() string {
			return name
		},
	}
}

func TestStartMultiRelay(t *testing.T) {
	RegisteredClients["ethereum"] = newMockClient
	RegisteredClients["aleo"] = newMockClient

	ctx, cancel := context.WithTimeout(context.Background(), time.Second * 5)
	defer cancel()

	relays := Relays{newMockRelay("aleo"), newMockRelay("ethereum")}

	go relays.StartMultiRelay(ctx)
	
	time.Sleep(time.Second)
	assert.NotNil(t, chainCtxCncls["aleo"])
	assert.NotNil(t, chainCtxCncls["ethereum"])
}

func newMockClient(cfg *config.ChainConfig) IClient {
	if cfg.Name == "ethereum" {
		return &MockClient{
			getChains: func() ([]string, error) {
				return []string{"aleo", "other"}, nil
			},
		}
	} else if cfg.Name == "aleo" {
		return &MockClient{
			getChains: func() ([]string, error) {
				return []string{"ethereum", "other"}, nil
			},
		}
	} else {
		return &MockClient{
			getChains: func() ([]string, error) {
				return []string{"aleo", "ethereum"}, nil
			},
		}
	}
}
