package aleo

import (
	"context"
	"strings"
	"time"

	"github.com/venture23-aleo/attestor/chainService/chain"
	aleoRpc "github.com/venture23-aleo/attestor/chainService/chain/aleo/rpc"
	"github.com/venture23-aleo/attestor/chainService/config"
	"github.com/venture23-aleo/attestor/chainService/store"
)

const (
	defaultWaitDur = time.Hour * 24
	outPacket      = "out_packets"
	aleo           = "aleo"
)

// Namespaces
const (
	baseSeqNumNameSpace  = "aleo_bsns"
	retryPacketNamespace = "aleo_rpns"
)

type Client struct {
	aleoClient aleoRpc.IAleoRPC
	name       string
	programID  string
	queryUrl   string
	network    string
	chainID    uint32
	waitDur    time.Duration
	startFrom  uint32
}

type aleoPacket struct {
	version     string
	source      aleoPacketNetworkAddress
	sequence    string
	destination aleoPacketNetworkAddress
	message     aleoMessage
	height      string
}

type aleoPacketNetworkAddress struct {
	chainID string
	address string
}

type aleoMessage struct {
	token    string
	receiver string
	amount   string
	sender   string
}

func (cl *Client) GetPktWithSeq(ctx context.Context, dst uint32, seqNum uint64) (*chain.Packet, error) {
	mappingKey := constructOutMappingKey(dst, seqNum)
	message, err := cl.aleoClient.GetMappingValue(ctx, cl.programID, outPacket, mappingKey)
	if err != nil {
		return nil, err
	}

	pktStr, err := parseMessage(message[mappingKey])
	if err != nil {
		return nil, err
	}
	return parseAleoPacket(pktStr)
}

func (cl *Client) CurHeight(ctx context.Context) uint64 {
	height, err := cl.aleoClient.GetLatestHeight(ctx)
	if err != nil {
		return 0
	}
	return uint64(height)
}

func (cl *Client) getDestChains() ([]string, error) {
	return []string{"ethereum"}, nil
}

func (cl *Client) Name() string {
	return cl.name
}

func (cl *Client) GetChainID() uint32 {
	return cl.chainID
}

func (cl *Client) getPacket(ctx context.Context, seqNum uint64) (*chain.Packet, error) {
	return nil, nil
}

func (cl *Client) FeedPacket(ctx context.Context, ch chan<- *chain.Packet) {

	go cl.managePacket(ctx)
	go cl.pruneBaseSeqNum(ctx, ch)
	go cl.retryFeed(ctx, ch)

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

	}

}

func (cl *Client) pruneBaseSeqNum(ctx context.Context, ch chan<- *chain.Packet) {
	// also fill gap and put in retry feed
	ticker := time.NewTicker(time.Hour * 2)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

		seqHeightRanges, shouldFetch := store.PruneBaseSeqNum(baseSeqNumNameSpace)
		if !shouldFetch {
			continue
		}

		startSeqNum, endSeqNum := seqHeightRanges[0][0], seqHeightRanges[0][1]
		for i := startSeqNum; i < endSeqNum; i++ {
			pkt, err := cl.getPacket(ctx, i)
			if err != nil {
				// log/handle error
			}
			ch <- pkt
		}
	}
}

func (cl *Client) retryFeed(ctx context.Context, ch chan<- *chain.Packet) {
	ticker := time.NewTicker(time.Hour) // todo: define in config
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

		// retrieve and delete is inefficient approach as it deletes the entry each time it retrieves it
		// for each packet. However with an assumption that packet will rarely reside inside retry namespace
		// this is the most efficient approach.
		pkt, err := store.RetrieveAndDeleteFirstPacket(retryPacketNamespace)
		if err != nil {
			//log error
			continue
		}
		if pkt != nil {
			ch <- pkt
		}
	}
}

func (cl *Client) managePacket(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case pkt := <-retryCh:
			err := store.StoreRetryPacket(retryPacketNamespace, pkt)
			if err != nil {
				//log error
			}
		case pkt := <-completedCh:
			err := store.StoreBaseSeqNum(baseSeqNumNameSpace, pkt.Sequence, pkt.Height)
			if err != nil {
				// log error
			}
		}
	}
}

func NewClient(cfg *config.ChainConfig) chain.IClient {
	err := createNamespaces()
	if err != nil {
		panic(err)
	}

	urlSlice := strings.Split(cfg.NodeUrl, "|")
	if len(urlSlice) != 2 {
		panic("invalid format. Expected format:  <rpc_endpoint>|<network>:: example: http://localhost:3030|testnet3")
	}

	aleoClient, err := aleoRpc.NewRPC(urlSlice[0], urlSlice[1])
	if err != nil {
		panic("failed to create aleoclient")
	}

	name := cfg.Name
	if name == "" {
		name = aleo
	}

	waitDur := cfg.WaitDuration
	if waitDur == 0 {
		waitDur = defaultWaitDur
	}

	return &Client{
		queryUrl:   urlSlice[0],
		network:    urlSlice[1],
		aleoClient: aleoClient,
		waitDur:    waitDur,
		chainID:    cfg.ChainID,
		programID:  cfg.BridgeContract,
		name:       name,
	}
}

/*

version+source.chain_id+source.address+sequence

"version":version+ "source":

type SignaturePacket struct{
	hash string
	isWhite string
}

bhp256(hash:respective_hash,isWhite:isWhite) -->
*/

/*
ethereum hash:
bytes32 prefixedHash = keccak256(
	abi.encodePacked(
		"\x19Ethereum Signed Message:\n32", // check if it is provided by abi package
		packetHash,
		tryVote
	)
	);

	tryVote=1 for Yes, 2 for No

*/

/*

function hash(PacketLibrary.InPacket memory packet) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            packet.version,
            packet.sequence,
            packet.sourceTokenService.chainId,
            packet.sourceTokenService.addr,
            packet.destTokenService.chainId,
            packet.destTokenService.addr,
            packet.message.senderAddress,
            packet.message.destTokenAddress,
                packet.message.amount,
                packet.message.receiverAddress,
            packet.height)
        );
    }

*/
