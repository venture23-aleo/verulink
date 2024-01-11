package relay

import (
	"context"
	"errors"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/store"
	"go.uber.org/zap"
)

type MockDestClient struct {
	sendPacket       func() error
	getName          func() string
	getWalletBalance func() (uint64, error)
	minRequiredBal   uint64
	isTxnFinalized   func(pkt *chain.Packet) (bool, error)
}

func (m MockDestClient) Name() string {
	return m.getName()
}

func (m MockDestClient) GetFinalityHeight() uint64 {
	return 1
}

func (m MockDestClient) SendPacket(ctx context.Context, packet *chain.Packet) (err error) {
	if m.sendPacket != nil {
		return m.sendPacket()
	}
	return nil
}

func (m MockDestClient) IsPktTxnFinalized(ctx context.Context, pkt *chain.Packet) (bool, error) {
	if m.isTxnFinalized != nil {
		return m.isTxnFinalized(pkt)
	}
	return true, nil
}

func (m MockDestClient) GetMinReqBalForMakingTxn() uint64 {
	return m.minRequiredBal
}

func (m MockDestClient) GetWalletBalance(ctx context.Context) (uint64, error) {
	if m.getWalletBalance != nil {
		return m.getWalletBalance()
	}
	return 10, nil
}

func (m MockDestClient) GetChainID() uint32 {
	return 0
}

func (m MockDestClient) GetDestChains() ([]string, error) {
	return nil, nil
}

type MockSrcClient struct {
	getname        func() string
	getPkt         func() (*chain.Packet, error)
	curHeight      uint64
	blockGenTime   time.Duration
	finalityHeight uint64
	chainID        uint32
}

func (m MockSrcClient) Name() string {
	return m.getname()
}

func (m *MockSrcClient) setHeight(h uint64) {
	m.curHeight = h
}
func (m MockSrcClient) GetPktWithSeq(ctx context.Context, dest uint32, seqNum uint64) (*chain.Packet, error) {
	return m.getPkt()
}

// Returns current height of chain
func (m MockSrcClient) CurHeight(ctx context.Context) uint64 {
	return m.curHeight
}

// Return average duration to generate a block by blockchain
func (m MockSrcClient) GetBlockGenTime() time.Duration {
	return m.blockGenTime
}

func (m MockSrcClient) GetFinalityHeight() uint64 {
	return m.finalityHeight
}

func (m MockSrcClient) GetChainID() uint32 {
	return m.chainID
}

func (m MockSrcClient) GetDestChains() ([]string, error) {
	return nil, nil
}

func initDB() (func(), error) {
	p := "./relayTest.db"
	err := store.InitKVStore(p)
	if err != nil {
		return nil, err
	}
	return func() {
		os.RemoveAll(p)
	}, nil
}

func TestReceivePacket(t *testing.T) {
	t.Run("test_pkt_receive_happy_path", func(t *testing.T) {
		srcChain := MockSrcClient{
			finalityHeight: 64,
			getPkt: func() (*chain.Packet, error) {
				return &chain.Packet{
					Height: 1,
				}, nil
			},
			curHeight: 66,
		}
		re := &relay{
			srcChain:   srcChain,
			destChain:  MockDestClient{},
			nextSeqNum: 10,
			pktCh:      make(chan *chain.Packet),
			logger: func() *zap.Logger {
				l, err := zap.NewDevelopment()
				require.NoError(t, err)
				return l
			}(),
		}

		ctx, cncl := context.WithCancel(context.Background())
		defer cncl()

		go re.startReceiving(ctx)
		time.Sleep(time.Millisecond * 100)
		require.EqualValues(t, re.nextSeqNum, 10)

		<-re.pktCh
		time.Sleep(time.Millisecond * 10)
		require.EqualValues(t, re.nextSeqNum, 11)
	})

	t.Run("test_for_finality_height_not_reached", func(t *testing.T) {
		yieldPacket := make(chan struct{})
		srcChain := &MockSrcClient{
			finalityHeight: 64,
			getPkt: func() (*chain.Packet, error) {
				<-yieldPacket
				return &chain.Packet{
					Height: 1,
				}, nil
			},
			curHeight: 1,
		}

		re := &relay{
			srcChain:   srcChain,
			destChain:  MockDestClient{},
			nextSeqNum: 10,
			pktCh:      make(chan *chain.Packet),
			logger: func() *zap.Logger {
				l, err := zap.NewDevelopment()
				require.NoError(t, err)
				return l
			}(),
		}

		ctx, cncl := context.WithCancel(context.Background())
		defer cncl()

		go re.startReceiving(ctx)
		t.Log("Started to receive packets")
		yieldPacket <- struct{}{}

		require.EqualValues(t, 10, re.nextSeqNum)
		srcChain.curHeight = 66
		yieldPacket <- struct{}{}

		t.Log("Waiting for packet")
		<-re.pktCh
		time.Sleep(time.Millisecond * 100)
		require.EqualValues(t, 11, re.nextSeqNum)

	})

}

func TestCreateNamespaces(t *testing.T) {
	srcName := "srcChain"
	destName := "destChain"
	srcClient := MockSrcClient{
		getname: func() string {
			return srcName
		},
	}
	destClient := MockDestClient{
		getName: func() string {
			return destName
		},
	}
	dbRemover, err := initDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	re := relay{
		srcChain:  srcClient,
		destChain: destClient,
	}
	err = re.createNamespaces()
	require.NoError(t, err)

	expectedRetryPktNS := fmt.Sprintf("%s-%s-%d", srcName, destName, retry)
	require.Equal(t, expectedRetryPktNS, re.retryPktNameSpace)

	expectedTransactedPktNs := fmt.Sprintf("%s-%s-%d", srcName, destName, transacted)
	require.Equal(t, expectedTransactedPktNs, re.transactedPktNameSpace)

	expectedBaseSeqNumNs := fmt.Sprintf("%s-%s-%d", srcName, destName, baseSeqNum)
	require.Equal(t, expectedBaseSeqNumNs, re.baseSeqNumNameSpace)
}

func TestStartSending(t *testing.T) {

	t.Run("test_happy_path", func(t *testing.T) {
		dbRemover, err := initDB()
		require.NoError(t, err)
		t.Cleanup(dbRemover)
		dC := MockDestClient{
			sendPacket: func() error {
				return nil
			},
			getName: func() string {
				return "destChain"
			},
		}

		sC := MockSrcClient{
			getname: func() string {
				return "srcChain"
			},
		}
		re := relay{
			srcChain:  sC,
			destChain: dC,
			pktCh:     make(chan *chain.Packet),
			logger: func() *zap.Logger {
				l, err := zap.NewDevelopment()
				require.NoError(t, err)
				return l
			}(),
		}
		err = re.createNamespaces()
		require.NoError(t, err)

		ctx, ctxCncl := context.WithCancel(context.Background())
		defer ctxCncl()
		go re.startSending(ctx)

		total := uint64(10)
		for i := uint64(1); i <= total; i++ {
			pkt := &chain.Packet{
				Sequence: i,
			}
			re.pktCh <- pkt
		}
		re.pktCh <- &chain.Packet{Sequence: 1000} // to assure above packets are all handled
		ctxCncl()

		ch := store.RetrieveNPackets(re.transactedPktNameSpace, int(total))
		seq := uint64(1)
		for pkt := range ch {
			require.Equal(t, pkt.Sequence, seq)
			seq++
		}

	})

	t.Run("test_pkt_stored_in_retry_namespace", func(t *testing.T) {
		dbRemover, err := initDB()
		require.NoError(t, err)
		t.Cleanup(dbRemover)
		dC := MockDestClient{
			sendPacket: func() error {
				return errors.New("unknown error")
			},
			getName: func() string {
				return "destChain"
			},
		}

		sC := MockSrcClient{
			getname: func() string {
				return "srcChain"
			},
		}
		re := relay{
			srcChain:  sC,
			destChain: dC,
			pktCh:     make(chan *chain.Packet),
			logger: func() *zap.Logger {
				l, err := zap.NewDevelopment()
				require.NoError(t, err)
				return l
			}(),
		}
		err = re.createNamespaces()
		require.NoError(t, err)

		ctx, ctxCncl := context.WithCancel(context.Background())
		defer ctxCncl()
		go re.startSending(ctx)

		total := uint64(10)
		for i := uint64(1); i <= total; i++ {
			re.pktCh <- &chain.Packet{
				Sequence: i,
			}
		}

		re.pktCh <- &chain.Packet{Sequence: 1000} // to assure above packets are all handled
		ctxCncl()

		ch := store.RetrieveNPackets(re.retryPktNameSpace, int(total))
		seq := uint64(1)
		for pkt := range ch {
			require.Equal(t, pkt.Sequence, seq)
			seq++
		}
	})

	t.Run("test_already_send_pkt_error", func(t *testing.T) {
		dbRemover, err := initDB()
		require.NoError(t, err)
		t.Cleanup(dbRemover)
		curchainHeight := uint64(100)
		dC := MockDestClient{
			sendPacket: func() error {
				return chain.AlreadyRelayedPacket{CurChainHeight: curchainHeight}
			},
			getName: func() string {
				return "destChain"
			},
		}

		sC := MockSrcClient{
			getname: func() string {
				return "srcChain"
			},
		}
		re := relay{
			srcChain:  sC,
			destChain: dC,
			pktCh:     make(chan *chain.Packet),
			logger: func() *zap.Logger {
				l, err := zap.NewDevelopment()
				require.NoError(t, err)
				return l
			}(),
		}
		err = re.createNamespaces()
		require.NoError(t, err)

		ctx, ctxCncl := context.WithCancel(context.Background())
		defer ctxCncl()
		go re.startSending(ctx)

		total := uint64(10)
		for i := uint64(1); i <= total; i++ {
			re.pktCh <- &chain.Packet{
				Sequence: i,
			}
		}

		re.pktCh <- &chain.Packet{Sequence: 1000} // to assure above packets are all handled
		ctxCncl()

		ch := store.RetrieveNPackets(re.transactedPktNameSpace, int(total))
		seq := uint64(1)
		for pkt := range ch {
			require.Equal(t, pkt.Sequence, seq)
			require.Equal(t, curchainHeight, pkt.Height)
			seq++
		}
	})

	t.Run("test_insufficient_bal_error", func(t *testing.T) {
		dbRemover, err := initDB()
		require.NoError(t, err)
		t.Cleanup(dbRemover)
		sendError := true
		increaseBal := false
		dC := MockDestClient{
			sendPacket: func() error {
				if sendError {
					return chain.InsufficientBalanceErr{CurBalance: 9}
				}
				return nil
			},
			getName: func() string {
				return "destChain"
			},
			getWalletBalance: func() (uint64, error) {
				if increaseBal {
					return 100, nil
				}
				return 8, nil
			},
		}

		sC := MockSrcClient{
			getname: func() string {
				return "srcChain"
			},
		}

		re := relay{
			srcChain:  sC,
			destChain: dC,
			pktCh:     make(chan *chain.Packet),
			logger: func() *zap.Logger {
				l, err := zap.NewDevelopment()
				require.NoError(t, err)
				return l
			}(),
			pollBalDur: time.Millisecond,
		}
		err = re.createNamespaces()
		require.NoError(t, err)

		ctx, ctxCncl := context.WithCancel(context.Background())
		defer ctxCncl()
		go re.startSending(ctx)

		re.pktCh <- &chain.Packet{Sequence: 10}
		sendError = false
		increaseBal = true
		time.Sleep(time.Millisecond * 10)
		re.pktCh <- &chain.Packet{Sequence: 1000} // assure previous packet is passed through

		ch := store.RetrieveNPackets(re.transactedPktNameSpace, 1)
		pkt := <-ch
		t.Logf("Sequence number: %d", pkt.Sequence)
		require.Equal(t, uint64(10), pkt.Sequence)
	})
}

func TestPruneDB(t *testing.T) {
	dbRemover, err := initDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	skipSeq := uint64(1)
	re := relay{
		srcChain: MockSrcClient{
			getname: func() string { return "srcChain" },
		},
		destChain: MockDestClient{
			getName: func() string { return "destChain" },
			isTxnFinalized: func(pkt *chain.Packet) (bool, error) {
				if pkt.Sequence == skipSeq {
					return false, nil
				}
				return true, nil
			},
		},
		pruneDBDur: time.Second,
		logger: func() *zap.Logger {
			l, err := zap.NewDevelopment()
			require.NoError(t, err)
			return l
		}(),
	}
	err = re.createNamespaces()
	require.NoError(t, err)
	for i := uint64(1); i < 10; i++ {
		pkt := &chain.Packet{
			Sequence: i,
		}
		err = store.StoreTransactedPacket(re.transactedPktNameSpace, pkt)
		require.NoError(t, err)
	}

	ctx, ctxCncl := context.WithCancel(context.Background())
	defer ctxCncl()
	go re.pruneDB(ctx)
	time.Sleep(time.Second * 5) // wait for pruneBaseSeqNum go routine to complete

	ch := store.RetrieveNPackets(re.transactedPktNameSpace, 10)
	count := 0
	for range ch {
		count++
	}
	require.Equal(t, 1, count)
	ctxCncl()
	for i := uint64(2); i < 10; i++ {
		isExist := store.ExistInGivenNamespace(re.baseSeqNumNameSpace, i)
		require.True(t, isExist)
		isExist = store.ExistInGivenNamespace(re.transactedPktNameSpace, i)
		require.False(t, isExist)
	}
	isExist := store.ExistInGivenNamespace(re.baseSeqNumNameSpace, skipSeq)
	require.False(t, isExist)
	isExist = store.ExistInGivenNamespace(re.transactedPktNameSpace, skipSeq)
	require.True(t, isExist)
}

func TestPruneBaseSeqNum(t *testing.T) {
	dbRemover, err := initDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	var seqNums []uint64
	for i := uint64(1); i < 10; i++ {
		if i == 5 {
			continue
		}
		seqNums = append(seqNums, i)
	}

	re := relay{
		srcChain: MockSrcClient{
			getname: func() string { return "srcChain" },
		},
		destChain: MockDestClient{
			getName: func() string { return "destChain" },
		},
		pruneBaseSeqNumDur: time.Millisecond * 10,
		logger: func() *zap.Logger {
			l, err := zap.NewDevelopment()
			require.NoError(t, err)
			return l
		}(),
	}
	err = re.createNamespaces()
	require.NoError(t, err)

	store.RemoveTxnKeyAndStoreBaseSeqNum("", nil, re.baseSeqNumNameSpace, seqNums, nil)
	ctx, ctxCncl := context.WithCancel(context.Background())
	defer ctxCncl()
	now := time.Now()
	go re.pruneBaseSeqNum(ctx)
	time.Sleep(time.Second)
	t.Log("BseqNum: ", re.bSeqNum)
	require.Equal(t, uint64(4), re.bSeqNum)
	require.True(t, re.bSeqNumUpdateTime.After(now))
	now = time.Now()

	seqNums = []uint64{5}
	store.RemoveTxnKeyAndStoreBaseSeqNum("", nil, re.baseSeqNumNameSpace, seqNums, nil)
	time.Sleep(time.Second)
	require.Equal(t, uint64(9), re.bSeqNum)
	require.True(t, re.bSeqNumUpdateTime.After(now))
}

func TestRetryLeftOutPackets(t *testing.T) {

	t.Run("test simple retry", func(t *testing.T) {
		dbRemover, err := initDB()
		require.NoError(t, err)
		t.Cleanup(dbRemover)

		re := relay{
			srcChain: MockSrcClient{
				getname: func() string { return "srcChain" },
			},
			destChain: MockDestClient{
				getName: func() string { return "destChain" },
			},
			pktCh:       make(chan *chain.Packet),
			retryPktDur: time.Second,
		}

		err = re.createNamespaces()
		require.NoError(t, err)

		pkt := &chain.Packet{
			Sequence: 2,
		}
		re.bSeqNum = 1
		re.nextSeqNum = 3
		err = store.StoreRetryPacket(re.retryPktNameSpace, pkt)
		require.NoError(t, err)
		ctx, ctxCncl := context.WithCancel(context.Background())
		defer ctxCncl()
		go re.retryLeftOutPackets(ctx)

		tick := time.NewTicker(time.Second * 5)
		select {
		case pkt := <-re.pktCh:
			require.Equal(t, uint64(2), pkt.Sequence)
		case <-tick.C:
			t.Log("Timeout")
			t.Fail()
		}
	})
}
