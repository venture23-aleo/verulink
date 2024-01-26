package ethereum

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"go.uber.org/zap"

	abi "github.com/venture23-aleo/attestor/chainService/chain/ethereum/abi"
	"github.com/venture23-aleo/attestor/chainService/config"
	"github.com/venture23-aleo/attestor/chainService/logger"
	"github.com/venture23-aleo/attestor/chainService/store"

	ether "github.com/ethereum/go-ethereum"
	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	"github.com/venture23-aleo/attestor/chainService/chain"
)

const (
	defaultWaitDur                       = 24 * time.Hour
	ethereum                             = "ethereum"
	defaultHeightDifferenceForFilterLogs = 100
	avgBlockGenDur                       = time.Second * 12
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
	address           ethCommon.Address
	eth               *ethclient.Client
	bridge            *abi.Bridge
	minRequiredGasFee uint64
	waitDur           time.Duration
	nextBlockHeight   uint64
	chainID           *big.Int
	rpcEndpoint       string
	filterTopic       ethCommon.Hash
}

func (cl *Client) Name() string {
	return cl.name
}

func (cl *Client) GetSourceChain() (string, string) {
	return cl.name, cl.address.Hex()
}

func (cl *Client) GetChainID() *big.Int {
	return cl.chainID
}

func (cl *Client) blockHeightPriorWaitDur(ctx context.Context) uint64 {
	curHeight, err := cl.eth.BlockNumber(ctx)
	if err != nil {
		logger.GetLogger().Error("error while getting current height", zap.Error(err))
		return 0
	}
	return curHeight - uint64(cl.waitDur/avgBlockGenDur) // total number of blocks that has to be passed in the waiting duration
}

func (cl *Client) parseBlock(ctx context.Context, height uint64) (pkts []*chain.Packet, err error) {
	latestHeight := cl.blockHeightPriorWaitDur(ctx)
	if height > latestHeight {
		// retry after waiting for proper wait duration
		time.Sleep(time.Duration(height-latestHeight) * avgBlockGenDur)
		latestHeight = cl.blockHeightPriorWaitDur(ctx)
		if height > latestHeight {
			return nil, errors.New("next height greater than latest height")
		}
	}

	var packets []*chain.Packet
	for startHeight := height; startHeight <= latestHeight; startHeight += defaultHeightDifferenceForFilterLogs {
		endHeight := startHeight + defaultHeightDifferenceForFilterLogs
		if endHeight > latestHeight {
			endHeight = latestHeight
		}
		pkts, err := cl.filterPacketLogs(ctx, startHeight, endHeight)
		if err != nil {
			return nil, err
		}
		packets = append(packets, pkts...)
	}

	return packets, nil
}

func (cl *Client) filterPacketLogs(ctx context.Context, fromHeight, toHeight uint64) ([]*chain.Packet, error) {
	fromHeightBig, toHeightBig := big.NewInt(int64(fromHeight)), big.NewInt(int64(toHeight))
	logs, err := cl.eth.FilterLogs(ctx, ether.FilterQuery{
		FromBlock: fromHeightBig,
		ToBlock:   toHeightBig,
		Addresses: []ethCommon.Address{cl.address},
		Topics: [][]ethCommon.Hash{
			{cl.filterTopic},
		},
	})
	if err != nil {
		return nil, err
	}
	packets := make([]*chain.Packet, 0)
	for _, l := range logs {
		packetDispatched, err := cl.bridge.ParsePacketDispatched(l)
		if err != nil {
			return nil, err // TODO: test to find out if error has to be thrown or just continue
		}
		commonPacket := &chain.Packet{
			Version:  uint8(packetDispatched.Packet.Version.Uint64()),
			Sequence: packetDispatched.Packet.Sequence.Uint64(),
			Destination: chain.NetworkAddress{
				ChainID: packetDispatched.Packet.DestTokenService.ChainId,
				Address: packetDispatched.Packet.DestTokenService.Addr,
			},
			Source: chain.NetworkAddress{
				ChainID: packetDispatched.Packet.SourceTokenService.ChainId,
				Address: string(packetDispatched.Packet.SourceTokenService.Addr.Bytes()),
			},
			Message: chain.Message{
				DestTokenAddress: packetDispatched.Packet.Message.DestTokenAddress,
				ReceiverAddress:  packetDispatched.Packet.Message.ReceiverAddress,
				SenderAddress:    string(packetDispatched.Packet.Message.SenderAddress.Bytes()),
				Amount:           packetDispatched.Packet.Message.Amount,
			},
			Height: packetDispatched.Packet.Height.Uint64(),
		}
		packets = append(packets, commonPacket)
		logger.GetLogger().Debug("packet fetched", zap.Uint64("sequence_number", commonPacket.Sequence))
	}
	return packets, nil
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

		pkts, err := cl.parseBlock(ctx, cl.nextBlockHeight)
		if err != nil {
			continue // retry if err
		}
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
		logger.GetLogger().Info("retrying ethereum feed", zap.String("namespace", retryPacketNamespaces[index]))
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
		logger.GetLogger().Info("pruning ethereum base sequence number namespace",
			zap.String("namespace", baseSeqNamespaces[index]))

		ns := baseSeqNamespaces[index]
		chainIDStr := strings.ReplaceAll(ns, baseSeqNumNameSpacePrefix, "")
		chainID := new(big.Int)
		chainID, _ = chainID.SetString(chainIDStr, 10)
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
			pkts, err := cl.parseBlock(ctx, i) // TODO: call filter logs directly
			if err != nil {
				continue // retry the same block if err
			}
			for _, pkt := range pkts {
				if pkt.Destination.ChainID.Cmp(chainID) != 0 {
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
			logger.GetLogger().Info("Adding to retry namespace", zap.Any("packet", pkt))
			ns := retryPacketNamespacePrefix +  pkt.Destination.ChainID.String()
			err := store.StoreRetryPacket(ns, pkt)
			if err != nil {
				logger.GetLogger().Error(
					"error while storing packet info",
					zap.Error(err),
					zap.String("namespace", ns))
			}
		case pkt := <-completedCh:
			ns := baseSeqNumNameSpacePrefix + pkt.Destination.ChainID.String()
			logger.GetLogger().Info("Updating base seq num",
				zap.String("namespace", ns),
				zap.Any("source_chain_id", pkt.Source.ChainID),
				zap.Any("dest_chain_id", pkt.Destination.ChainID),
				zap.Uint64("pkt_seq_num", pkt.Sequence),
			)
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

func NewClient(cfg *config.ChainConfig, _ map[string]*big.Int) chain.IClient {
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

		retryPacketNamespaces = append(retryPacketNamespaces, rns)
		baseSeqNamespaces = append(baseSeqNamespaces, bns)
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
		address:         ethCommon.HexToAddress(cfg.BridgeContract),
		eth:             ethclient,
		bridge:          bridgeClient,
		waitDur:         waitDur,
		chainID:         cfg.ChainID,
		nextBlockHeight: cfg.StartHeight,
		filterTopic:     ethCommon.HexToHash(cfg.FilterTopic),
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
	return []string{"2"}
}
