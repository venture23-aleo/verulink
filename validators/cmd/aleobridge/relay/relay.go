package relay

import (
	"context"
	"fmt"
	"sync"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

type Relayer interface {
	Init(ctx context.Context)
	Name() string
}

func NewRelay(
	srcChain chain.IReceiver,
	destChain chain.ISender,
	eventCh <-chan *chain.ChainEvent,

) Relayer {
	return &relay{
		srcChain:  srcChain,
		destChain: destChain,
		eventCh:   eventCh,
	}
}

type chainShore struct {
	client IClient
	/*
		fields like events, channels, packets
	*/
	packets   map[uint64]*chain.Packet // seqNum: Packet
	packetChn chan *chain.Packet       // buffer channel, probably buffer num=10
}

// structure to manage packet transfer from source to destination.
type relay struct {
	srcChain  chain.IReceiver
	destChain chain.ISender

	pktCh      chan *chain.Packet
	nextSeqNum uint64
	eventCh    <-chan *chain.ChainEvent

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

	go r.startReceiving(ctx)
	// add configurable num
	for i := 0; i < 10; i++ {
		go r.startSending(ctx)
	}

	go r.pruneDB(ctx)

	for {
		select {
		case <-ctx.Done():
			//
		default:
		}

		event := <-r.eventCh
		_ = event

		// if event means that we need to exit{
		// 	break
		// }

	}

	// todo: add appropriate waiters here or where Init is being called
}

func (r *relay) startReceiving(ctx context.Context) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for {
		select {
		case <-ctx.Done():
			// todo: Manage context done, basically packet states
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

	}

}

func (r *relay) startSending(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			//
		default:
		}

		pkt := <-r.pktCh

		txnHash, err := r.destChain.SendPacket(ctx, pkt)
		if err != nil {
			// todo: send to retry loop and handle according to error
		}
		// store packet and txnHash in db
		// run a function that prunes db by checking if txn is finalized.
		// if we can decide that txn is not going to finalize then we can resend packet to r.pktCh
		_ = txnHash
		//

	}
}

func (r *relay) pruneDB(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			// todo:
		default:
		}

		/*
			Store txnHash as value with key as orderable timestamp

			Get ordered hashes and check if txn is finalized
		*/
	}
}

func (r *relay) Name() string {
	return fmt.Sprintf("%s-%s bridge", r.srcChain.Name(), r.destChain.Name())
}
