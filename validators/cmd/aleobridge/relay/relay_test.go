package relay

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/store"
	"go.uber.org/zap"
)

type MockDestClient struct {
}

func (m MockDestClient) Name() string {
	return "destClient"
}

func (m MockDestClient) GetFinalityHeight() uint64 {
	return 1
}

func (m MockDestClient) SendPacket(ctx context.Context, packet *chain.Packet) (err error) {
	return nil
}

func (m MockDestClient) IsPktTxnFinalized(ctx context.Context, pkt *chain.Packet) (bool, error) {
	return true, nil
}

func (m MockDestClient) GetMinReqBalForMakingTxn() uint64 {
	return 1
}

func (m MockDestClient) GetWalletBalance(ctx context.Context) (uint64, error) {
	return 10, nil
}

type MockSrcClient struct {
	getname        func() string
	getPkt         func() (*chain.Packet, error)
	getCurHeight   func() uint64
	blockGenTime   time.Duration
	finalityHeight uint64
}

func (m MockSrcClient) Name() string {
	return m.getname()
}

func (m MockSrcClient) GetPktWithSeq(ctx context.Context, dest string, seqNum uint64) (*chain.Packet, error) {
	return m.getPkt()
}

func (MockSrcClient) GetPktsWithSeqAndInSameHeight(ctx context.Context, seqNum uint64) ([]*chain.Packet, error) {
	return nil, nil
}

// Returns current height of chain
func (m MockSrcClient) CurHeight() uint64 {
	return m.getCurHeight()
}

// Return average duration to generate a block by blockchain
func (m MockSrcClient) GetBlockGenTime() time.Duration {
	return m.blockGenTime
}

func (m MockSrcClient) GetFinalityHeight() uint64 {
	return m.finalityHeight
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
	dbRemover, err := initDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	t.Run("test_pkt_receive_happy_path", func(t *testing.T) {
		srcChain := MockSrcClient{
			finalityHeight: 64,
			getPkt: func() (*chain.Packet, error) {
				return &chain.Packet{
					Height: 1,
				}, nil
			},
			getCurHeight: func() uint64 {
				return 66
			},
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
}

func TestContextCancel(t *testing.T) {

}

func TestCreateNamespaces(t *testing.T) {

}

func TestStartReceiving(t *testing.T) {

}

func TestStartSending(t *testing.T) {

}

func TestPruneDB(t *testing.T) {

}

func TestPruneBaseSeqNum(t *testing.T) {

}

func TestRetryLeftOutPackets(t *testing.T) {

}

func TestGetName(t *testing.T) {

}

func TestPollBalance(t *testing.T) {

}
