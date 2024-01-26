package relay

import (
	"context"
	"flag"
	"math"
	"math/big"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/venture23-aleo/attestor/chainService/chain"
	"github.com/venture23-aleo/attestor/chainService/config"
	"github.com/venture23-aleo/attestor/chainService/store"
)

func setupDB(t *testing.T, p string) func() {
	err := store.InitKVStore(p)
	require.NoError(t, err)

	return func() {
		os.RemoveAll(p)
	}
}

type feeder struct {
	name string
	feed func()
}

func (f *feeder) FeedPacket(ctx context.Context, pktCh chan<- *chain.Packet) {
	if f.feed != nil {
		f.feed()
	}
}

func (f *feeder) Name() string {
	return f.name
}

func getClient(f *feeder) func(cfg *config.ChainConfig, m map[string]*big.Int) chain.IClient {
	return func(cfg *config.ChainConfig, m map[string]*big.Int) chain.IClient {
		return f
	}
}

type testHash struct {
}

func getHasher(h *testHash) func(sp *chain.ScreenedPacket) string {
	return func(sp *chain.ScreenedPacket) string {
		return ""
	}
}

func TestInitPacketFeeder(t *testing.T) {
	t.Run("normal flow", func(t *testing.T) {
		dbRemover := setupDB(t, "./bolt.db")
		t.Cleanup(dbRemover)

		startedToFeedAleoPkt := false
		startedToFeedEthereumPkt := false
		RegisteredClients["aleo"] = getClient(&feeder{name: "aleo", feed: func() {
			startedToFeedAleoPkt = true
			for {
				time.Sleep(time.Second)
			}
		}})

		RegisteredHashers["aleo"] = getHasher(&testHash{})

		RegisteredClients["ethereum"] = getClient(&feeder{name: "ethereum", feed: func() {
			startedToFeedEthereumPkt = true

			for {
				time.Sleep(time.Second)
			}
		}})
		RegisteredHashers["ethereum"] = getHasher(&testHash{})

		cfgs := []*config.ChainConfig{
			{
				Name:    "aleo",
				ChainID: big.NewInt(math.MaxInt),
			}, {
				Name:    "ethereum",
				ChainID: big.NewInt(1),
			},
		}

		r := relay{}
		ctx := context.TODO()
		pktCh := make(chan *chain.Packet)
		go r.initPacketFeeder(ctx, cfgs, pktCh)
		time.Sleep(time.Second * 1)
		require.True(t, startedToFeedAleoPkt)
		require.True(t, startedToFeedEthereumPkt)

	})

	t.Run("should panic for undefined module", func(t *testing.T) {
		dbRemover := setupDB(t, "./bolt.db")
		t.Cleanup(dbRemover)
		cfgs := []*config.ChainConfig{
			{
				Name:    "aleo",
				ChainID: big.NewInt(math.MaxInt),
			}, {
				Name:    "ethereum",
				ChainID: big.NewInt(1),
			},
		}

		r := relay{}
		ctx := context.TODO()
		pktCh := make(chan *chain.Packet)

		require.Panics(t, func() {
			r.initPacketFeeder(ctx, cfgs, pktCh)
		})

	})

	t.Run("should panic for undefined hash function", func(t *testing.T) {
		dbRemover := setupDB(t, "./bolt.db")
		t.Cleanup(dbRemover)
		RegisteredClients["aleo"] = getClient(&feeder{name: "aleo", feed: func() {
			for {
				time.Sleep(time.Second)
			}
		}})

		RegisteredClients["ethereum"] = getClient(&feeder{name: "ethereum", feed: func() {
			for {
				time.Sleep(time.Second)
			}
		}})

		cfgs := []*config.ChainConfig{
			{
				Name:    "aleo",
				ChainID: big.NewInt(math.MaxInt),
			}, {
				Name:    "ethereum",
				ChainID: big.NewInt(1),
			},
		}

		r := relay{}
		ctx := context.TODO()
		pktCh := make(chan *chain.Packet)
		require.Panics(t, func() {
			r.initPacketFeeder(ctx, cfgs, pktCh)
		})

	})
}

func setupConfig(t *testing.T) func() {
	p := "testConfigs"
	err := os.MkdirAll(p, 0777)
	require.NoError(t, err)
	configStr := `
db_path: db
consume_packet_workers: 1
log:
  encoding: console
  output_path: relays.log
`
	configPath := filepath.Join(p, "config.yaml")
	f, err := os.Create(configPath)
	require.NoError(t, err)
	_, err = f.WriteString(configStr)
	require.NoError(t, err)
	flag.Set("config", configPath)
	err = config.InitConfig()
	require.NoError(t, err)
	return func() {
		os.RemoveAll(p)
	}
}

func TestConsumePackets(t *testing.T) {

	t.Run("test packet consumption", func(t *testing.T) {
		cleaner := setupConfig(t)
		t.Cleanup(cleaner)

		r := relay{
			collector: &collectorTest{},
			screener:  &screenTest{},
			signer:    &signTest{},
		}

		pktCh := make(chan *chain.Packet)
		go r.consumePackets(context.TODO(), pktCh)
		ctx, cncl := context.WithTimeout(context.TODO(), time.Second*5)
		defer cncl()

		pktCh <- &chain.Packet{}
		select {
		case <-ctx.Done():
			require.Fail(t, "packet not consumed")
		case pktCh <- &chain.Packet{}:
		}
	})
}

func TestProcessPackets(t *testing.T) {

}

type collectorTest struct {
	sendToCollector          func(sp *chain.ScreenedPacket, signature string) error
	receivePktsFromCollector func(ctx context.Context, ch chan<- *chain.Packet)
}

func (c *collectorTest) SendToCollector(sp *chain.ScreenedPacket, signature string) error {
	if c.sendToCollector != nil {
		return c.sendToCollector(sp, signature)
	}
	return nil
}

func (c *collectorTest) ReceivePktsFromCollector(ctx context.Context, ch chan<- *chain.Packet) {
	if c.receivePktsFromCollector != nil {
		c.receivePktsFromCollector(ctx, ch)
	}
}

type screenTest struct {
	storeWhiteStatus func(pkt *chain.Packet, isWhite bool) error
	screen           func() bool
}

func (s *screenTest) StoreWhiteStatus(pkt *chain.Packet, isWhite bool) error {
	if s.storeWhiteStatus != nil {
		return s.storeWhiteStatus(pkt, isWhite)
	}
	return nil
}

func (s *screenTest) Screen(pkt *chain.Packet) bool {
	if s.screen != nil {
		return s.screen()
	}
	return true
}

type signTest struct {
	signScreenedPacket func(sp *chain.ScreenedPacket, hash chain.HashFunc) (string, error)
}

func (s *signTest) SignScreenedPacket(sp *chain.ScreenedPacket, hash chain.HashFunc) (string, error) {
	if s.signScreenedPacket != nil {
		return s.signScreenedPacket(sp, hash)
	}

	return "mySignature", nil
}
