package relay

import (
	"context"
	"fmt"
	"sync"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

type Relayer interface {
	Start(ctx context.Context)
	Init(ctx context.Context)
	Name() string
}

func NewRelay(chain1, chain2 IClient) Relayer {
	return &relay{
		Chain1: chain1,
		Chain2: chain2,
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

type relay struct {
	Chain1         IClient
	Chain2         IClient
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

	//panic if any error
	r.initliazed = true
	r.panicRecovered = make(chan struct{}) // shall need bufferred channel equal to the number of goroutines that handles panic for panic context
}

func (r *relay) Start(ctx context.Context) {
	r.mu.Lock()
	defer r.mu.Unlock()

	go r.chainEvents(ctx, r.Chain1)
	go r.chainEvents(ctx, r.Chain2)

	/*
		1. Check base sequence number in both contracts // think about Sabin dai's concern
		2. Check sequence number from database.
		3. Consider max(baseSeqNum, dbSeqNum)
		4. Start getting packets from contracts
		5. Attest and relay the packets
	*/

	go r.relayPackets(ctx, r.Chain1, r.Chain2)
	go r.relayPackets(ctx, r.Chain2, r.Chain1)
}

func (r *relay) Name() string {
	return fmt.Sprintf("%s-%s bridge", r.Chain1.Name(), r.Chain2.Name())
}

// Relay Packets from `fromChain` to `toChain`
func (r *relay) relayPackets(ctx context.Context, fromChain, toChain IClient) {
	for {
		select {
		case <-ctx.Done():
			// manage current states
			return
		default:
		}

		pkt, err := fromChain.GetNextPacket(ctx)
		if err != nil {
			// handle error based on error type
			continue
		}

		// toChain.SendPacket()
		_ = pkt

	}
}

func (r *relay) chainEvents(ctx context.Context, chain IClient /*channels for transferring events as well*/) {

}
