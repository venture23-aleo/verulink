package ethereum

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"go.uber.org/zap"

	abi "github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain/ethereum/abi"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/config"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/logger"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/store"

	ether "github.com/ethereum/go-ethereum"
	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
)

const (
	ethereum                             = "ethereum"
	defaultHeightDifferenceForFilterLogs = 100            // number of blocks to filter logs from
	defaultValidityWaitDur               = 24 * time.Hour // currently selected wait duration
	// defaultFeedPktWaitDur sets ticker in FeedPacket. It is chosen to be two-third of time taken
	// for blockchain to produce defaultHeightDifferenceForFilterLogs number of blocks so that
	// it shall never lag with blockchain.
	defaultFeedPktWaitDur = defaultHeightDifferenceForFilterLogs * avgBlockGenDur * 2 / 3
	avgBlockGenDur        = time.Second * 12 // average duration for block generation
	// defaultRetryPacketWaitDur regularly fetches packets from local store(currently boltdb)
	// These are those packets that were failed to process i.e. some error occurred while packets
	// were being processed.
	defaultRetryPacketWaitDur = time.Hour * 12
	// defaultPruneBaseSeqWaitDur regularly prunes keys that are in ascending order till there
	// is no gap between subsequent keys.
	defaultPruneBaseSeqWaitDur = time.Hour * 6
	retrievePacketNum          = 10 // total number of retry-packets to expect in single query
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

type ethClientI interface {
	GetCurrentBlock(ctx context.Context) (uint64, error)
	FilterLogs(
		ctx context.Context, fromHeight uint64, toHeight uint64,
		contractAddress ethCommon.Address, topics ethCommon.Hash) ([]types.Log, error)
}

type ethClient struct {
	eth *ethclient.Client
}

func NewEthClient(rpcEndPoint string) ethClientI {
	rpc, err := rpc.Dial(rpcEndPoint)
	if err != nil {
		panic(err)
	}

	return &ethClient{
		eth: ethclient.NewClient(rpc),
	}
}

func (eth *ethClient) GetCurrentBlock(ctx context.Context) (uint64, error) {
	currentBlock, err := eth.eth.BlockNumber(ctx)
	if err != nil {
		return 0, err
	}
	return currentBlock, nil
}

func (eth *ethClient) FilterLogs(
	ctx context.Context, fromHeight uint64, toHeight uint64,
	contractAddress ethCommon.Address, topics ethCommon.Hash) ([]types.Log, error) {

	logs, err := eth.eth.FilterLogs(ctx, ether.FilterQuery{
		FromBlock: big.NewInt(int64(fromHeight)),
		ToBlock:   big.NewInt(int64(toHeight)),
		Addresses: []ethCommon.Address{contractAddress},
		Topics:    [][]ethCommon.Hash{{topics}},
	})
	if err != nil {
		return nil, err
	}
	return logs, err
}

type bridgeClientI interface {
	ParsePacketDispatched(log types.Log) (*abi.BridgePacketDispatched, error)
}

type bridgeClient struct {
	bridge *abi.Bridge
}

func NewBridgeClient(contractAddress ethCommon.Address, ethClient *ethclient.Client) (bridgeClientI, error) {
	bridge, err := abi.NewBridge(contractAddress, ethClient)
	if err != nil {
		return nil, err
	}
	return &bridgeClient{
		bridge: bridge,
	}, nil
}

func (brcl *bridgeClient) ParsePacketDispatched(log types.Log) (*abi.BridgePacketDispatched, error) {
	packetDispatched, err := brcl.bridge.ParsePacketDispatched(log)
	if err != nil {
		return nil, err
	}
	return packetDispatched, nil
}

type Client struct {
	name    string
	address ethCommon.Address
	eth     ethClientI
	bridge  bridgeClientI
	// destChainsIDMap stores list of destination chain-ids that this attestor shall support
	destChainsIDMap map[string]bool
	// nextBlockHeight is next start height for filter logs
	nextBlockHeight uint64
	chainID         *big.Int
	filterTopic     ethCommon.Hash
	// waitHeight is number of blocks to pass before considering a block as matured.
	// i.e if waitHeight is 10 and packet is available in block height 100 then
	// packet is matured if current block number is >= 110 and it is immatured
	// if current block number is < 110
	waitHeight                uint64
	feedPktWaitDur            time.Duration
	retryPacketWaitDur        time.Duration
	pruneBaseSeqNumberWaitDur time.Duration
}

func (cl *Client) Name() string {
	return cl.name
}

// blockHeightPriorWaitDur returns matured block height from which events logs can be parsed.
// This height equals (currentHeight - finalityHeight) at max
// If wait duration is 24 hours then it will be equal to (currentHeight - 7200)
func (cl *Client) blockHeightPriorWaitDur(ctx context.Context) (uint64, error) {
	curHeight, err := cl.eth.GetCurrentBlock(ctx)
	if err != nil {
		logger.GetLogger().Error("error while getting current height")
		return 0, err
	}

	return curHeight - cl.waitHeight, nil // total number of blocks that has to be passed in the waiting duration
}

// filterPacketLogs filters the event logs of the bridge contract and returns all the PacketDispatched events that are
// emitted from fromHeight to toHeight. The result of the query is close ended i.e. both fromHeight and toHeight are
// included in the range for filtering
func (cl *Client) filterPacketLogs(ctx context.Context, fromHeight, toHeight uint64) ([]*chain.Packet, error) {
	logs, err := cl.eth.FilterLogs(ctx, fromHeight, toHeight, cl.address, cl.filterTopic)
	if err != nil {
		return nil, err
	}
	packets := make([]*chain.Packet, 0)
	for _, l := range logs {
		packetDispatched, err := cl.bridge.ParsePacketDispatched(l)
		if err != nil {
			return nil, err
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
				Address: packetDispatched.Packet.SourceTokenService.Addr.Hex(),
			},
			Message: chain.Message{
				DestTokenAddress: packetDispatched.Packet.Message.DestTokenAddress,
				ReceiverAddress:  packetDispatched.Packet.Message.ReceiverAddress,
				SenderAddress:    packetDispatched.Packet.Message.SenderAddress.Hex(),
				Amount:           packetDispatched.Packet.Message.Amount,
			},
			Height: packetDispatched.Packet.Height.Uint64(),
		}
		packets = append(packets, commonPacket)
		logger.GetLogger().Debug("packet fetched", zap.Uint64("sequence_number", commonPacket.Sequence))
	}
	return packets, nil
}

// FeedPacket spawsn few goroutines and starts to poll ethereum on regular interval.
// It uses filter logs method that specifically filters particular packet related logs.
// The range of block numbers to filter logs is set in defaultHeightDifferenceForFilterLogs.
// It parses the logs and if packet has destination chainID that this attestor supports then
// it will be send to the channel ch.
func (cl *Client) FeedPacket(ctx context.Context, ch chan<- *chain.Packet) {
	go cl.managePacket(ctx)
	go cl.pruneBaseSeqNum(ctx, ch)
	go cl.retryFeed(ctx, ch)

	dur := cl.feedPktWaitDur
	if dur == 0 {
		dur = defaultFeedPktWaitDur
	}
	ticker := time.NewTicker(dur)

	defer ticker.Stop()

	var baseHeight uint64
	for dest := range cl.destChainsIDMap {
		ns := baseSeqNumNameSpacePrefix + dest
		_, startHeight := store.GetStartingSeqNumAndHeight(ns)
		if startHeight < baseHeight {
			baseHeight = startHeight
		}
	}
	// if start height provided from config is less than already processed packet as stated
	// by database, then next height is taken from database.
	// If start height should be greater than already stored in database then start height from
	// config should be considered.
	if cl.nextBlockHeight < baseHeight {
		cl.nextBlockHeight = baseHeight
	}

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

	L1:
		for {

			maturedHeight, err := cl.blockHeightPriorWaitDur(ctx)
			if err != nil {
				logger.GetLogger().Error("error while getting block height", zap.Error(err))
				break L1
			}

			if maturedHeight < cl.nextBlockHeight {
				diff := cl.nextBlockHeight - maturedHeight
				time.Sleep((time.Duration(diff) * avgBlockGenDur))
				break L1
			}

			// startHeight adds 1, because filterLogs returns packets inclusively for startHeight and endHeight.
			// We don't want to re-process already processed packets
			for startHeight := cl.nextBlockHeight; startHeight <= maturedHeight; startHeight += defaultHeightDifferenceForFilterLogs + 1 {
				endHeight := startHeight + defaultHeightDifferenceForFilterLogs
				if endHeight > maturedHeight {
					endHeight = maturedHeight
				}
				pkts, err := cl.filterPacketLogs(ctx, startHeight, endHeight)
				if err != nil {
					logger.GetLogger().Error("Filter packet log error",
						zap.Error(err),
						zap.Uint64("start_height", startHeight),
						zap.Uint64("end_height", endHeight),
					)
					break L1
				}

				for _, pkt := range pkts {
					if _, ok := cl.destChainsIDMap[pkt.Destination.ChainID.String()]; ok {
						ch <- pkt
					}
				}
				cl.nextBlockHeight = endHeight + 1
			}
		}
	}
}

// retryFeed periodically retrieves the packets from the "retryPacketNamespace"  and sends to the
// channel ch. It also deletes the retrieved packets in the namespace.
func (cl *Client) retryFeed(ctx context.Context, ch chan<- *chain.Packet) {
	ticker := time.NewTicker(cl.retryPacketWaitDur) // todo: define in config
	index := 0
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

		logger.GetLogger().Info("retrying ethereum feed", zap.String("namespace", retryPacketNamespaces[index]))
		// retrieve and delete is inefficient approach as it deletes the entry each time it retrieves it
		// for each packet. However with an assumption that packet will rarely reside inside retry namespace
		// this seems to be the efficient approach.
		pkts, err := store.RetrieveAndDeleteNPackets(retryPacketNamespaces[index], retrievePacketNum)
		if err != nil {
			logger.GetLogger().Error("error while retrieving retry packets", zap.Error(err))
			goto indIncr
		}

		for _, pkt := range pkts {
			ch <- pkt
		}

	indIncr:
		index = (index + 1) % len(retryPacketNamespaces) // switch index to next destination id
	}
}

// pruneBaseSeqNum updates the sequence number upto which the attestor has processed all the
// outgoing packets of the source chain. The first entry of the baseSeqNum bucket represents
// the base sequence number. refetches the packets if there is gap while updating the base
// seq number. eg. in the case we have the following packets 1, 2, 3, 7, 8. It deletes the entry
// 1 and 2 and fetches the packets 4, 5 and 6 and sends it to ch channel.
// There can be multiple gaps but it will consider first gap.
func (cl *Client) pruneBaseSeqNum(ctx context.Context, ch chan<- *chain.Packet) {
	ticker := time.NewTicker(cl.pruneBaseSeqNumberWaitDur)
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
		chainID.SetString(chainIDStr, 10)
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
		for s := startHeight; s <= endHeight; s += defaultHeightDifferenceForFilterLogs + 1 {
			e := s + defaultHeightDifferenceForFilterLogs
			if e > endHeight {
				e = endHeight
			}

			pkts, err := cl.filterPacketLogs(ctx, s, e)
			if err != nil {
				logger.GetLogger().Error(err.Error())
				break
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

// managePacket manages packets that should either be reprocessed or consider as completed.
// It puts packets from retryCh into retry-packet namespace to retry them later.
// If the packets comes inot completedCh, then its sequence number and height will be
// put into sequence number namespace to later on prune base sequence number
func (cl *Client) managePacket(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case pkt := <-retryCh:
			logger.GetLogger().Info("Adding to retry namespace", zap.Any("packet", pkt))
			ns := retryPacketNamespacePrefix + pkt.Destination.ChainID.String()
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
				zap.String("source_chain_id", pkt.Source.ChainID.String()),
				zap.String("dest_chain_id", pkt.Destination.ChainID.String()),
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

// GetMissedPacket retrieves packet from source chain and returns it.
func (cl *Client) GetMissedPacket(
	ctx context.Context, missedPkt *chain.MissedPacket) (
	*chain.Packet, error) {

	pkts, err := cl.filterPacketLogs(ctx, missedPkt.Height, missedPkt.Height)
	if err != nil {
		return nil, err
	}

	for _, pkt := range pkts {

		if pkt.Sequence == missedPkt.SeqNum &&
			pkt.Destination.ChainID == missedPkt.TargetChainID {

			return pkt, nil
		}
	}
	return nil, errors.New("packet not found")
}

// NewClient initializes Client and returns the interface to chain.IClient
func NewClient(cfg *config.ChainConfig) chain.IClient {
	ethclient := NewEthClient(cfg.NodeUrl)
	contractAddress := ethCommon.HexToAddress(cfg.BridgeContract)
	bridgeClient, err := abi.NewBridge(contractAddress, ethclient.(*ethClient).eth)
	if err != nil {
		panic(fmt.Sprintf("failed to create ethereum bridge client. Error: %s", err.Error()))
	}

	destChainsMap := make(map[string]bool)
	var namespaces []string
	for _, destChain := range cfg.DestChains {
		rns := retryPacketNamespacePrefix + destChain
		bns := baseSeqNumNameSpacePrefix + destChain
		namespaces = append(namespaces, rns, bns)

		retryPacketNamespaces = append(retryPacketNamespaces, rns)
		baseSeqNamespaces = append(baseSeqNamespaces, bns)
		destChainsMap[destChain] = true
	}

	err = store.CreateNamespaces(namespaces)
	if err != nil {
		panic(fmt.Sprintf("failed to create namespaces. Error: %s", err.Error()))
	}

	name := cfg.Name
	if name == "" {
		name = ethereum
	}

	validityWaitDur := cfg.PacketValidityWaitDuration
	if validityWaitDur == 0 {
		validityWaitDur = defaultValidityWaitDur
	}

	feedPktWaitDur := cfg.FeedPacketWaitDuration
	if feedPktWaitDur == 0 {
		feedPktWaitDur = defaultFeedPktWaitDur
	}

	retryPacketWaitDur := cfg.RetryPacketWaitDur
	if retryPacketWaitDur == 0 {
		retryPacketWaitDur = defaultRetryPacketWaitDur
	}

	pruneBaseSeqWaitDur := cfg.PruneBaseSeqNumberWaitDur
	if pruneBaseSeqWaitDur == 0 {
		pruneBaseSeqWaitDur = defaultPruneBaseSeqWaitDur
	}

	waitHeight := uint64(validityWaitDur / avgBlockGenDur)
	if waitHeight < cfg.FinalityHeight {
		waitHeight = cfg.FinalityHeight
	}

	return &Client{
		name:                      name,
		address:                   ethCommon.HexToAddress(cfg.BridgeContract),
		eth:                       ethclient,
		bridge:                    bridgeClient,
		destChainsIDMap:           destChainsMap,
		waitHeight:                waitHeight,
		chainID:                   cfg.ChainID,
		nextBlockHeight:           cfg.StartHeight,
		filterTopic:               ethCommon.HexToHash(cfg.FilterTopic),
		feedPktWaitDur:            feedPktWaitDur,
		retryPacketWaitDur:        retryPacketWaitDur,
		pruneBaseSeqNumberWaitDur: pruneBaseSeqWaitDur,
	}
}
