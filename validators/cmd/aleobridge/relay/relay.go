package relay

import (
	"context"
	"fmt"
	"sync"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/store"
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
	srcChain  chain.IReceiver
	destChain chain.ISender

	sChainCond, dChainCond *sync.Cond
	pktCh                  chan *chain.Packet
	nextSeqNum             uint64
	eventCh                <-chan *chain.ChainEvent

	mu             sync.Mutex
	initliazed     bool
	panicRecovered chan struct{}
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
	1. Check base sequence number in both contracts // think about Sabin dai's concern
	2. Check sequence number from database.
	3. Consider max(baseSeqNum, dbSeqNum)
	4. Start getting packets from contracts
	5. Attest and relay the packets
	*/

	//panic if any error
	r.initliazed = true
	r.panicRecovered = make(chan struct{}) // shall need bufferred channel equal to the number of goroutines that handles panic for panic context

	go r.pollChainEvents(ctx, r.srcChain.Name(), chainConds[r.srcChain.Name()])
	go r.pollChainEvents(ctx, r.destChain.Name(), chainConds[r.destChain.Name()])

	go r.startReceiving(ctx)
	// add configurable num
	for i := 0; i < 10; i++ {
		go r.startSending(ctx)
	}

	go r.pruneDB(ctx)

	// todo: add appropriate waiters here or where Init is being called
	// seems reasonable to use ctx.Done() call here and check if cancel error is due to panic
	// and if so, uninitialize relay i.e. r.initialiazed = false
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
			// todo: send to retry loop and handle according to error
		}

		txnPkt := &chain.TxnPacket{
			TxnHash: txnHash,
			Pkt:     pkt,
		}
		err = store.StoreTransactedPacket("", txnPkt)
		if err != nil {
			//
		}
		// run a function that prunes db by checking if txn is finalized.
		// if we can decide that txn is not going to finalize then we can resend packet to r.pktCh
		//

	}
}

func (r *relay) pruneDB(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			ctxErr := ctx.Err()
			_ = ctxErr
			/*
				if ctxErr == PanicErr{
					1. handle panic for pruneDB
					2. Notify r.panicRecovered or some other field

				}
			*/
			// todo:
		default:
		}

		/*
			Store txnHash as value with key as orderable timestamp

			Get ordered hashes and check if txn is finalized
		*/
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
