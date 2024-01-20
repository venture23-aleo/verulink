package ethereum

import (
	"context"
	"fmt"
	"math/big"
	"time"

	ethBind "github.com/ethereum/go-ethereum/accounts/abi/bind"
	ethTypes "github.com/ethereum/go-ethereum/core/types"

	abi "github.com/venture23-aleo/attestor/chainService/chain/ethereum/abi"
	"github.com/venture23-aleo/attestor/chainService/config"
	"github.com/venture23-aleo/attestor/chainService/store"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	"github.com/venture23-aleo/attestor/chainService/chain"
)

const (
	defaultWaitDur = 24 * time.Hour
	ethereum       = "ethereum"
)

// Namespaces
const (
	baseSeqNumNameSpace  = "ethereum_bsns"
	retryPacketNamespace = "ethereum_rpns"
)

type Client struct {
	name              string
	address           string
	eth               *ethclient.Client
	bridge            abi.ABIInterface
	minRequiredGasFee uint64
	waitDur           time.Duration
	nextBlockHeight   uint64
	chainID           uint32
}

func (cl *Client) GetPktWithSeq(ctx context.Context, dstChainID uint32, seqNum uint64) (*chain.Packet, error) {
	destChainIDBig := &big.Int{}
	destChainIDBig.SetUint64(uint64(dstChainID))
	sequenceNumber := &big.Int{}
	sequenceNumber.SetUint64(seqNum)

	ethpacket, err := cl.bridge.OutgoingPackets(&ethBind.CallOpts{Context: ctx}, destChainIDBig, sequenceNumber)
	if err != nil {
		return nil, err
	}

	packet := &chain.Packet{
		Version: ethpacket.Version.Uint64(),
		Destination: chain.NetworkAddress{
			ChainID: uint32(ethpacket.DestTokenService.ChainId.Uint64()),
			Address: ethpacket.DestTokenService.Addr,
		},
		Source: chain.NetworkAddress{
			ChainID: uint32(ethpacket.SourceTokenService.ChainId.Uint64()),
			Address: string(ethpacket.SourceTokenService.Addr.Bytes()),
		},
		Sequence: ethpacket.Sequence.Uint64(),
		Message: chain.Message{
			DestTokenAddress: ethpacket.Message.DestTokenAddress,
			Amount:           ethpacket.Message.Amount,
			ReceiverAddress:  ethpacket.Message.ReceiverAddress,
			SenderAddress:    string(ethpacket.Message.SenderAddress.Bytes()),
		},
		Height: ethpacket.Height.Uint64(),
	}
	return packet, nil
}

func (cl *Client) attestMessage(opts *ethBind.TransactOpts, packet abi.PacketLibraryInPacket) (tx *ethTypes.Transaction, err error) {
	tx, err = cl.bridge.ReceivePacket(opts, packet)
	return
}

func (cl *Client) curHeight(ctx context.Context) uint64 {
	height, err := cl.eth.BlockNumber(ctx)
	if err != nil {
		return 0
	}
	return height
}

func (cl *Client) Name() string {
	return cl.name
}

func (cl *Client) GetSourceChain() (string, string) {
	return cl.name, cl.address
}

func (cl *Client) GetChainID() uint32 {
	return cl.chainID
}

func (cl *Client) createNamespaces() error {
	err := store.CreateNamespace(baseSeqNumNameSpace)
	if err != nil {
		return err
	}
	return store.CreateNamespace(retryPacketNamespace)
}

func NewClient(cfg *config.ChainConfig) chain.IClient {
	/*
		Initialize eth client and panic if any error occurs.
		nextSeq should start from 1
	*/
	rpc, err := rpc.Dial(cfg.NodeUrl)
	if err != nil {
		panic(fmt.Sprintf("failed to create ethereum rpc client. Error: %s", err.Error()))
	}

	ethclient := ethclient.NewClient(rpc)
	contractAddress := ethCommon.HexToAddress(cfg.BridgeContract)
	bridgeClient, err := abi.NewBridge(contractAddress, ethclient)
	if err != nil {
		panic(fmt.Sprintf("failed to create ethereum bridge client. Error: %s", err.Error()))
	}

	name := cfg.Name
	if name == "" {
		name = ethereum
	}
	waitDur := cfg.WaitDuration
	if waitDur == 0 {
		waitDur = defaultWaitDur
	}

	return &Client{
		name:            name,
		address:         cfg.BridgeContract,
		eth:             ethclient,
		bridge:          bridgeClient,
		waitDur:         waitDur,
		chainID:         cfg.ChainID,
		nextBlockHeight: cfg.StartFrom,
	}
}

func (cl *Client) parseBlock(ctx context.Context, height uint64) (pkts []*chain.Packet) {
	return
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

		pkts := cl.parseBlock(ctx, cl.nextBlockHeight)
		for _, pkt := range pkts {
			ch <- pkt
		}
		cl.nextBlockHeight++
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

		// seqNum is less useful for ethereum
		// We should now parse all the blocks between startHeight and Endheight including end height
		startHeight, endHeight := seqHeightRanges[1][0], seqHeightRanges[1][1]
		endSeqNum := seqHeightRanges[0][1]
	L1:
		for i := startHeight; i <= endHeight; i++ {
			pkts := cl.parseBlock(ctx, i)
			for _, pkt := range pkts {
				if pkt.Sequence == endSeqNum {
					break L1
				}
				ch <- pkt
			}
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

/*
Send packet immediately for it to be signed and sent to public database
If it fails to sign or send to public database, then send to retry namespace
Have a go routine to update base sequence number
For ethereum it should store it as seqNum:Height
For aleo it can store it as seqNum:nil

While updating baseseq num, if it finds any gap then it gets packet from retry namespace and
send it for it to be signed immediately.
If not available in namespace then download block and parse and store the packet

*/
