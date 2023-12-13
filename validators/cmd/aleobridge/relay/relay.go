package relay

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/store"
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
	panicRecovered         chan struct{}
	/*
		other fields if required
	*/

}

func (r *relay) Init(ctx context.Context) {
	if r.initliazed { //todo: might need to consider using sync.Once
		return
		//Reminder: context has changed. Take care of it.
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	/* todo:
	1. Check base sequence number in source contracts // think about Sabin dai's concern
	2. Check sequence number from database.
	3. Consider max(baseSeqNum, dbSeqNum)
	4. Start getting packets from contracts
	5. Relay the packets
	*/

	//panic if any error
	r.initliazed = true
	r.panicRecovered = make(chan struct{}) // shall need bufferred channel equal to the number of goroutines that handles panic for panic context

	go r.pollChainEvents(ctx, r.srcChain.Name(), chainConds[r.srcChain.Name()])
	go r.pollChainEvents(ctx, r.destChain.Name(), chainConds[r.destChain.Name()])

	go r.startReceiving(ctx)
	go r.startSending(ctx)

	go r.pruneDB(ctx)

	// todo: add appropriate waiters here or where Init is being called
	// seems reasonable to use ctx.Done() call here and check if cancel error is due to panic
	// and if so, uninitialize relay i.e. r.initialiazed = false
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

func (r *relay) startReceiving(ctx context.Context) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for {
		select {
		case <-ctx.Done():
			ctxErr := ctx.Err()
			_ = ctxErr
			/*
				if ctxErr == PanicErr{
					1. handle panic for startReceiving, basically packet states
					2. Notify r.panicRecovered or some other field

				}
			*/
			return
		default:
		}

		pkt, err := r.srcChain.GetPktWithSeq(ctx, r.nextSeqNum)
		if err != nil {

		}

		if pkt.Height+r.srcChain.GetFinalityHeight() >= r.srcChain.CurHeight() {
			// todo: wait according to difference between curHeight and packet height
			continue
		}

		r.pktCh <- pkt
		r.nextSeqNum++

	}

}

// should not be run in multiple goroutine because timestamp is made key for storing packet
// and multiple goroutine can cause loosing packet
func (r *relay) startSending(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			ctxErr := ctx.Err()
			_ = ctxErr
			/*
				if ctxErr == PanicErr{
					1. handle panic for startSending
					2. Notify r.panicRecovered or some other field

				}
			*/
			//
		default:
		}

		pkt := <-r.pktCh

		txnHash, err := r.destChain.SendPacket(ctx, pkt)
		if err != nil {
			switch {
			case errors.Is(err, insufficientBalanceErr):
				r.pollBalance(ctx)
				go func() { r.pktCh <- pkt }() // immediately send it to the channel
				continue
				/*
					case 2:
					case 3:
				*/

			}
			// todo: send to retry loop and handle according to error
			// store packet to retry later
			err = store.StoreRetryPacket(r.retryPktNameSpace, pkt)
		}

		txnPkt := &chain.TxnPacket{
			TxnHash: txnHash,
			Pkt:     pkt,
		}
		err = store.StoreTransactedPacket(r.transactedPktNameSpace, txnPkt)
		if err != nil {
			//
		}
		// run a function that prunes db by checking if txn is finalized.
		// if we can decide that txn is not going to finalize then we can resend packet to r.pktCh
		//

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
		txnPktKeys := make([][]byte, 10)
		for txnPkt := range ch {
			finalized, err := r.destChain.IsTxnFinalized(ctx, txnPkt.TxnHash)
			// todo: if we can decide here that this txn is not going to be finalized
			// then send packet to r.pktCh and delete its entry in db
			// we can send this info in err variable above that the chain has forked
			if err != nil {
				//log error
				continue
			}

			if !finalized {
				continue
			}

			txnPktKeys = append(txnPktKeys, txnPkt.SeqByte)
			seqNums = append(seqNums, txnPkt.Pkt.Sequence)
		}

		store.RemoveTxnKeyAndStoreBaseSeqNum(
			r.transactedPktNameSpace,
			txnPktKeys,
			r.baseSeqNumNameSpace,
			seqNums,
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
		bSeqNum := store.PruneBaseSeqNum(r.baseSeqNumNameSpace)
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

		if !(time.Since(r.bSeqNumUpdateTime) > time.Hour*24) || !(r.bSeqNum < r.nextSeqNum-1) {
			continue
		}

		curSeqNum := r.nextSeqNum - 1
		for seqNum := r.bSeqNum + 1; seqNum < curSeqNum; seqNum++ {
			if store.IsLocallyStored(
				[]string{r.transactedPktNameSpace, r.retryPktNameSpace},
				seqNum,
			) {
				continue
			}

			if r.bSeqNum >= seqNum {
				continue
			}

			//Now get from blockchain and feed to the system
			pkt, err := r.srcChain.GetPktWithSeq(ctx, seqNum)
			if err != nil {
				//todo: packet might have been pruned
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
