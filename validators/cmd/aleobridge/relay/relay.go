package relay

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/logger"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/store"
	"go.uber.org/zap"
)

const (
	retry = iota
	transacted
	baseSeqNum
)

type Relayer interface {
	Init(ctx context.Context)
	Name() string
}

func NewRelay(
	srcChain chain.IReceiver,
	destChain chain.ISender,
	sChainCond, dChainCond *sync.Cond,

) Relayer {
	return &relay{
		srcChain:   srcChain,
		destChain:  destChain,
		sChainCond: sChainCond,
		dChainCond: dChainCond,
	}
}

// structure to manage packet transfer from source to destination.
type relay struct {
	srcChain               chain.IReceiver
	destChain              chain.ISender
	retryPktNameSpace      string
	transactedPktNameSpace string
	baseSeqNumNameSpace    string
	sChainCond, dChainCond *sync.Cond
	pktCh                  chan *chain.Packet
	nextSeqNum             uint64
	eventCh                <-chan *chain.ChainEvent
	bSeqNumUpdateTime      time.Time
	bSeqNum                uint64
	mu                     sync.Mutex
	initliazed             bool
	logger                 *zap.Logger
}

func (r *relay) Init(ctx context.Context) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if !r.initliazed {
		r.initliazed = true
		bridge := fmt.Sprintf("%s-%s", r.srcChain.Name(), r.destChain.Name())
		r.logger = logger.Logger.With(zap.String("Bridge", bridge))
		r.createNamespaces()
		r.setBaseSeqNum()
		r.nextSeqNum = r.bSeqNum + 1

	}

	/**********Not required now***********************/
	// go r.pollChainEvents(ctx, r.srcChain.Name(), chainConds[r.srcChain.Name()])
	// go r.pollChainEvents(ctx, r.destChain.Name(), chainConds[r.destChain.Name()])

	go r.startReceiving(ctx)
	go r.startSending(ctx)

	go r.pruneDB(ctx)
	go r.retryLeftOutPackets(ctx)
	go r.pruneBaseSeqNum(ctx)

	<-ctx.Done()
}

func (r *relay) createNamespaces() (err error) {
	r.retryPktNameSpace = fmt.Sprintf("%s-%s-%d", r.srcChain.Name(), r.destChain.Name(), retry)
	err = store.CreateNamespace(r.retryPktNameSpace)
	if err != nil {
		return
	}
	r.transactedPktNameSpace = fmt.Sprintf("%s-%s-%d", r.srcChain.Name(), r.destChain.Name(), transacted)
	err = store.CreateNamespace(r.transactedPktNameSpace)
	if err != nil {
		return
	}
	r.baseSeqNumNameSpace = fmt.Sprintf("%s-%s-%d", r.srcChain.Name(), r.destChain.Name(), baseSeqNum)
	return store.CreateNamespace(r.baseSeqNumNameSpace)
}

func (r *relay) setBaseSeqNum() {
	r.bSeqNum = store.GetFirstKey(r.baseSeqNumNameSpace, uint64(0))
}

func (r *relay) startReceiving(ctx context.Context) {
	r.logger.Info("Starting to receive packets from source chain")
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		_, dstAddr := r.destChain.GetSourceChain()
		pkt, err := r.srcChain.GetPktWithSeq(ctx, dstAddr, r.nextSeqNum)
		if err != nil {
			//todo: if not found sleep accordingly
		}

		if pkt == nil {
			time.Sleep(time.Second * 10)
		}

		curSrcHeight := r.srcChain.CurHeight()
		if pkt.Height+r.srcChain.GetFinalityHeight() >= curSrcHeight {
			heightDiff := curSrcHeight - pkt.Height
			waitTime := r.srcChain.GetBlockGenTime() * time.Duration(heightDiff)
			time.Sleep(waitTime)
			continue
		}

		r.pktCh <- pkt
		r.nextSeqNum++
	}
}

func (r *relay) startSending(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			ctxErr := ctx.Err()
			_ = ctxErr
			return
		default:
		}

		pkt := <-r.pktCh

		r.logger.Info("Sending packet", zap.Uint64("seq_num", pkt.Sequence), zap.Uint64("packet_height", pkt.Height))

		err := r.destChain.SendPacket(ctx, pkt)
		if err != nil {
			r.logger.Error("Error while sending packet",
				zap.Error(err),
				zap.Uint64("packet_seq_num", pkt.Sequence),
				zap.Uint64("packet_height", pkt.Height))

			insufBalErr := chain.InsufficientBalanceErr{}
			alreadySendPkt := chain.AlreadyRelayedPacket{}

			switch {
			case errors.As(err, &insufBalErr):
				r.pollBalance(ctx, insufBalErr.CurBalance)
				go func() { r.pktCh <- pkt }() // immediately send it to the channel
				continue
			case errors.As(err, &alreadySendPkt):
				// In the chain we cannot know at which height this packet was relayed to.
				// Here the assignment incremented packet's height and is not the true height.
				// However the whole point is that attestor wants to make sure that packet they relayed
				// is finalized.
				// To check packet finality, we simply check packet's height and current blockchain height.
				// If the packet is already relayed by the attestor and has been finalized then we repeatedly
				// get alreadySendPkt error thus packet height gets updated.
				// It only requires single instance that chain don't fork and attestor is certain that it has
				// delivered the packet.
				pkt.Height = alreadySendPkt.CurChainHeight
				goto addTransactedPacket
			}

			r.logger.Info("storing packet for retry", zap.Uint64("seq_num", pkt.Sequence))
			err = store.StoreRetryPacket(r.retryPktNameSpace, pkt)
			if err != nil {
				r.logger.DPanic(err.Error())
			}
			continue
		}

	addTransactedPacket:
		r.logger.Info("storing sent packet", zap.Uint64("seq_num", pkt.Sequence))
		err = store.StoreTransactedPacket(r.transactedPktNameSpace, pkt)
		if err != nil {
			r.logger.DPanic(err.Error())
		}
	}
}

// If we find that transaction is not going to be finalized then we shall send the packet
// to retry namespace in database
func (r *relay) pruneDB(ctx context.Context) {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			ctxErr := ctx.Err()
			_ = ctxErr
		case <-ticker.C:
		default:
		}

		ch := store.RetrieveNPackets(r.transactedPktNameSpace, 10)
		seqNums := make([]uint64, 10)
		pktKeys := make([][]byte, 10)
		for pkt := range ch {
			r.logger.Info("Checking packet finality", zap.Uint64("seq_num", pkt.Sequence))
			finalized, err := r.destChain.IsPktTxnFinalized(ctx, pkt)
			// todo: if we can decide here that this packet attestation is not going
			// to be finalized due to fork then send packet to r.pktCh and delete its
			// entry in db
			// we can send this info in err variable above that the chain has forked
			if err != nil {
				r.logger.Error(err.Error())
				continue
			}

			if !finalized {
				continue
			}

			pktKeys = append(pktKeys, pkt.SeqByte)
			seqNums = append(seqNums, pkt.Sequence)
		}

		store.RemoveTxnKeyAndStoreBaseSeqNum(
			r.transactedPktNameSpace,
			pktKeys,
			r.baseSeqNumNameSpace,
			seqNums,
			r.logger,
		)
	}
}

func (r *relay) pruneBaseSeqNum(ctx context.Context) {
	ticker := time.NewTicker(time.Hour * 24)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
		bSeqNum := store.PruneBaseSeqNum(r.baseSeqNumNameSpace, r.logger)
		if bSeqNum > 0 {
			r.bSeqNum = bSeqNum
			r.bSeqNumUpdateTime = time.Now()
		}
	}
}

func (r *relay) retryLeftOutPackets(ctx context.Context) {
	ticker := time.NewTicker(time.Hour * 2)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

		// duration check will ensure that we gave enough time for another goroutine to check finalized transaction
		// and update db.
		// baseSeqNum < nextSeqNum -1, will ensure that we don't retry baseSeqNum and curSeqNum are equal as there is no
		// packets to check for
		if !(time.Since(r.bSeqNumUpdateTime) > time.Hour*24 && r.bSeqNum < r.nextSeqNum-1) {
			continue
		}

		curSeqNum := r.nextSeqNum - 1
		for seqNum := r.bSeqNum + 1; seqNum < curSeqNum; seqNum++ {
			pkt := store.GetPacket[uint64](r.retryPktNameSpace, seqNum, r.logger)
			if pkt != nil {
				r.pktCh <- pkt
				continue
			}
			if store.ExistInGivenNamespace(r.transactedPktNameSpace, seqNum) {
				continue
			}

			if r.bSeqNum >= seqNum {
				continue
			}

			_, dstAddr := r.destChain.GetSourceChain()

			//Now get from blockchain and feed to the system
			pkt, err := r.srcChain.GetPktWithSeq(ctx, dstAddr, seqNum)
			if err != nil {
				//todo: we might decide that older packets be pruned in src chain
				// and if it is pruned then r.bSeqNum can be updated to seqNum
				// further handling is not required because r.bSeqNum won't be updated with missing in-between-packets
				r.logger.Debug(err.Error())
				continue
			}

			r.pktCh <- pkt
		}
	}
}

func (r *relay) pollChainEvents(ctx context.Context, name string, cond *sync.Cond) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		func() {
			cond.L.Lock()
			cond.Wait()
			cond.L.Unlock()

			chainEventRWMu.RLock()
			event := chainEvents[name]
			chainEventRWMu.RUnlock()

			_ = event
		}()
	}
}

func (r *relay) Name() string {
	return fmt.Sprintf("%s-%s bridge", r.srcChain.Name(), r.destChain.Name())
}
