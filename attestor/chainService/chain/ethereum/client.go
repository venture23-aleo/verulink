package ethereum

import (
	"context"
	"fmt"
	"math/big"
	"strconv"
	"strings"
	"time"

	ethBind "github.com/ethereum/go-ethereum/accounts/abi/bind"
	ethTypes "github.com/ethereum/go-ethereum/core/types"
	"go.uber.org/zap"

	abi "github.com/venture23-aleo/attestor/chainService/chain/ethereum/abi"
	"github.com/venture23-aleo/attestor/chainService/config"
	"github.com/venture23-aleo/attestor/chainService/logger"
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
	baseSeqNumNameSpacePrefix  = "ethereum_bsns"
	retryPacketNamespacePrefix = "ethereum_rpns"
)

var (
	baseSeqNamespaces     []string
	retryPacketNamespaces []string
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

		pkts := cl.parseBlock(ctx, cl.nextBlockHeight) // todo: avoid sequential parsing/call
		for _, pkt := range pkts {
			ch <- pkt
		}
		cl.nextBlockHeight++
	}
}

func (cl *Client) retryFeed(ctx context.Context, ch chan<- *chain.Packet) {
	ticker := time.NewTicker(time.Hour) // todo: define in config
	index := 0
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

		if index == len(retryPacketNamespaces) {
			index = 0
		}

		// retrieve and delete is inefficient approach as it deletes the entry each time it retrieves it
		// for each packet. However with an assumption that packet will rarely reside inside retry namespace
		// this is the most efficient approach.
		pkts, err := store.RetrieveAndDeleteNPackets(retryPacketNamespaces[index], 10)
		if err != nil {
			//log error
			goto indIncr
		}

		for _, pkt := range pkts {
			ch <- pkt
		}

	indIncr:
		index++
	}
}

func (cl *Client) pruneBaseSeqNum(ctx context.Context, ch chan<- *chain.Packet) {
	ticker := time.NewTicker(time.Hour * 2)
	index := 0
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

		if index == len(baseSeqNamespaces) {
			index = 0
		}
		ns := baseSeqNamespaces[index]
		chainIDStr := strings.ReplaceAll(ns, baseSeqNumNameSpacePrefix, "")
		chainID, _ := strconv.ParseUint(chainIDStr, 10, 32)
		// segragate sequence numbers as per target chain
		seqHeightRanges, shouldFetch := store.PruneBaseSeqNum(ns)
		if !shouldFetch {
			continue
		}

		// seqNum is less useful for ethereum
		// We should now parse all the blocks between startHeight and Endheight including end height
		startSeqNum, endSeqNum := seqHeightRanges[0][0], seqHeightRanges[0][1]
		startHeight, endHeight := seqHeightRanges[1][0], seqHeightRanges[1][1]
	L1:
		for i := startHeight; i <= endHeight; i++ {
			pkts := cl.parseBlock(ctx, i)
			for _, pkt := range pkts {
				if pkt.Destination.ChainID != uint32(chainID) {
					continue
				}
				if pkt.Sequence <= startSeqNum {
					continue
				}

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
			chainID := strconv.FormatUint(uint64(pkt.Destination.ChainID), 10)
			ns := retryPacketNamespacePrefix + chainID
			err := store.StoreRetryPacket(ns, pkt)
			if err != nil {
				logger.GetLogger().Error(
					"error while storing packet info",
					zap.Error(err),
					zap.String("namespace", ns))
			}
		case pkt := <-completedCh:
			chainID := strconv.FormatUint(uint64(pkt.Destination.ChainID), 10)
			ns := baseSeqNumNameSpacePrefix + chainID
			err := store.StoreBaseSeqNum(ns, pkt.Sequence, pkt.Height)
			if err != nil {
				logger.GetLogger().Error(
					"error while storing packet info",
					zap.Error(err),
					zap.String("namespace", ns))
			}
		}
	}
}

func NewClient(cfg *config.ChainConfig, _ map[string]uint32) chain.IClient {
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

	destChains := getDestChains()
	var namespaces []string
	for _, destChain := range destChains {
		rns := retryPacketNamespacePrefix + destChain
		bns := baseSeqNumNameSpacePrefix + destChain
		namespaces = append(namespaces, rns, bns)
	}
	err = store.CreateNamespaces(namespaces)
	if err != nil {
		panic(fmt.Sprintf("failed to create namespaces. Error: %s", err.Error()))
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
		nextBlockHeight: cfg.StartHeight,
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

func getDestChains() []string { // list of chain IDs
	return nil
}
