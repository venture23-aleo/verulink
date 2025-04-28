package ethereum

import (
	"context"
	"errors"
	"fmt"
	"math"
	"math/big"
	"strings"
	"time"

	"go.uber.org/zap"

	abi "github.com/venture23-aleo/verulink/attestor/chainService/chain/ethereum/abi"
	"github.com/venture23-aleo/verulink/attestor/chainService/config"
	"github.com/venture23-aleo/verulink/attestor/chainService/logger"
	"github.com/venture23-aleo/verulink/attestor/chainService/metrics"
	"github.com/venture23-aleo/verulink/attestor/chainService/store"

	ether "github.com/ethereum/go-ethereum"
	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	"github.com/venture23-aleo/verulink/attestor/chainService/chain"
)

const (
	ethereum                             = "ethereum"
	defaultHeightDifferenceForFilterLogs = 100            // number of blocks to filter logs from
	defaultValidityWaitDur               = 24 * time.Hour // currently selected wait duration
	// defaultFeedPktWaitDur sets ticker in FeedPacket. It is chosen to be two-third of time taken
	// for blockchain to produce defaultHeightDifferenceForFilterLogs number of blocks so that
	// it shall never lag with blockchain.
	defaultFeedPktWaitDur = defaultHeightDifferenceForFilterLogs * defaultavgBlockGenDur * 2 / 3
	defaultavgBlockGenDur = time.Second * 12 // average duration for block generation
	// defaultRetryPacketWaitDur regularly fetches packets from local store(currently boltdb)
	// These are those packets that were failed to process i.e. some error occurred while packets
	// were being processed.
	defaultRetryPacketWaitDur = time.Hour * 12
	// defaultPruneBaseSeqWaitDur regularly prunes keys that are in ascending order till there
	// is no gap between subsequent keys.
	defaultPruneBaseSeqWaitDur = time.Hour * 6
	retrievePacketNum          = 10 // total number of retry-packets to expect in single query
	UP                         = 1
	DOWN                       = 0
)

// Namespaces
const (
	baseSeqNumNameSpacePrefix  = "ethereum_bsns"
	retryPacketNamespacePrefix = "ethereum_rpns"
)

var predicateVersions = map[uint8]bool{3: true, 4: true, 13: true}

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
	chainID     *big.Int
	filterTopic ethCommon.Hash
	// waitHeightMap is a map that stores waitHeight which is number of blocks to pass
	// before considering a block as matured. i.e if waitHeight is 10 and packet is
	// available in block height 100 then packet is matured if current block number is >= 110
	// and it is immatured if current block number is < 110
	waitHeightMap             map[string]uint64
	feedPktWaitDurMap         map[string]time.Duration
	retryPacketWaitDur        time.Duration
	pruneBaseSeqNumberWaitDur time.Duration
	averageBlockGenDur        time.Duration
	metrics                   *metrics.PrometheusMetrics
	retryPktNamespaces        []string
	baseSeqNamespaces         []string
	nextBlockHeightMap        map[string]uint64
	instantNextBlockHeightMap map[string]uint64
	instantPacketDurationMap  map[string]time.Duration
	instantWaitHeightMap      map[string]uint64
}

func (cl *Client) Name() string {
	return cl.name
}

// blockHeightPriorWaitDur returns matured block height from which events logs can be parsed.
// This height equals (currentHeight - finalityHeight) at max
// If wait duration is 24 hours then it will be equal to (currentHeight - 7200)
func (cl *Client) blockHeightPriorWaitDur(ctx context.Context, waitHeight uint64) (uint64, error) {
	curHeight, err := cl.eth.GetCurrentBlock(ctx)
	if err != nil {
		logger.GetLogger().Error("error while getting current height", zap.Any("chain", cl.name))
		cl.metrics.UpdateEthRPCStatus(logger.AttestorName, cl.chainID.String(), DOWN)
		return 0, err
	}
	cl.metrics.UpdateEthRPCStatus(logger.AttestorName, cl.chainID.String(), UP)

	return curHeight - waitHeight, nil // total number of blocks that has to be passed in the waiting duration
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

func (cl *Client) instantFeedPacket(ctx context.Context, baseHeight uint64, destchain string, ch chan<- *chain.Packet) {

	dur := cl.instantPacketDurationMap[destchain]
	if dur == 0 {
		// close the routine for instantly processing packet
		logger.GetLogger().Info("instant packet delivery closing for", zap.String("chain", cl.name))
		return
	}
	ticker := time.NewTicker(dur)

	defer ticker.Stop()

	// if start height provided from config is less than already processed packet as stated
	// by database, then next height is taken from database.
	// If start height should be greater than already stored in database then start height from
	// config should be considered.
	if cl.instantNextBlockHeightMap[destchain] < baseHeight {
		cl.instantNextBlockHeightMap[destchain] = baseHeight
	}

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			maturedHeight, err := cl.blockHeightPriorWaitDur(ctx, cl.instantWaitHeightMap[destchain])
			if err != nil {
				logger.GetLogger().Error("error while getting block height", zap.Error(err))
				continue
			}
			if maturedHeight < cl.instantNextBlockHeightMap[destchain] {
				diff := cl.instantNextBlockHeightMap[destchain] - maturedHeight
				logger.GetLogger().Info("Sleeping eth client for instant packet", zap.Uint64("height", diff))
				time.Sleep((time.Duration(diff) * cl.averageBlockGenDur))
				continue
			}

			// startHeight adds 1, because filterLogs returns packets inclusively for startHeight and endHeight.
			// We don't want to re-process already processed packets
			for startHeight := cl.instantNextBlockHeightMap[destchain]; startHeight <= maturedHeight; startHeight += defaultHeightDifferenceForFilterLogs + 1 {
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
					break
				}

				for _, pkt := range pkts {
					if predicateVersions[pkt.Version] {
						pkt.SetInstant(true)

						destChainID := pkt.Destination.ChainID.String()
						if _, ok := cl.destChainsIDMap[destChainID]; ok {
							cl.metrics.AddInstantPackets(logger.AttestorName, cl.chainID.String(), destChainID)
							logger.GetLogger().Info("sending packets instant packet", zap.Any("packet ", pkt.Sequence))
							ch <- pkt
						}
					}

				}
				cl.instantNextBlockHeightMap[destchain] = endHeight + 1
			}
		}

	}
}

func (cl *Client) feedPacket(ctx context.Context, baseHeight uint64, destchain string, ch chan<- *chain.Packet) {
	dur := cl.feedPktWaitDurMap[destchain]
	if dur == 0 {
		dur = defaultFeedPktWaitDur
	}
	ticker := time.NewTicker(dur)
	defer ticker.Stop()
	// if start height provided from config is less than already processed packet as stated
	// by database, then next height is taken from database.
	// If start height should be greater than already stored in database then start height from
	// config should be considered.
	if cl.nextBlockHeightMap[destchain] < baseHeight {
		cl.nextBlockHeightMap[destchain] = baseHeight
	}

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	L1:
		for {

			maturedHeight, err := cl.blockHeightPriorWaitDur(ctx, cl.waitHeightMap[destchain])
			if err != nil {
				logger.GetLogger().Error("error while getting block height for", zap.String("chain", cl.name), zap.Error(err))
				break L1
			}

			if maturedHeight < cl.nextBlockHeightMap[destchain] {
				diff := cl.nextBlockHeightMap[destchain] - maturedHeight
				time.Sleep((time.Duration(diff) * cl.averageBlockGenDur))
				break L1
			}

			// startHeight adds 1, because filterLogs returns packets inclusively for startHeight and endHeight.
			// We don't want to re-process already processed packets
			for startHeight := cl.nextBlockHeightMap[destchain]; startHeight <= maturedHeight; startHeight += defaultHeightDifferenceForFilterLogs + 1 {
				endHeight := startHeight + defaultHeightDifferenceForFilterLogs
				if endHeight > maturedHeight {
					endHeight = maturedHeight
				}
				pkts, err := cl.filterPacketLogs(ctx, startHeight, endHeight)
				if err != nil {
					logger.GetLogger().Error("Filter packet log error",
						zap.Error(err),
						zap.String("chain", cl.name),
						zap.Uint64("start_height", startHeight),
						zap.Uint64("end_height", endHeight),
					)
					break L1
				}

				for _, pkt := range pkts {
					if _, ok := cl.destChainsIDMap[pkt.Destination.ChainID.String()]; ok {
						cl.metrics.AddInPackets(logger.AttestorName, cl.chainID.String(), pkt.Destination.ChainID.String())
						ch <- pkt
					}
				}
				cl.nextBlockHeightMap[destchain] = endHeight + 1
			}
		}
	}

}

// FeedPacket spawsn few goroutines and starts to poll ethereum on regular interval.
// It uses filter logs method that specifically filters particular packet related logs.
// The range of block numbers to filter logs is set in defaultHeightDifferenceForFilterLogs.
// It parses the logs and if packet has destination chainID that this attestor supports then
// it will be send to the channel ch.
func (cl *Client) FeedPacket(ctx context.Context, ch chan<- *chain.Packet, completedCh chan *chain.Packet, retryCh chan *chain.Packet) {

	go cl.managePacket(ctx, completedCh, retryCh)
	go cl.pruneBaseSeqNum(ctx, ch)
	go cl.retryFeed(ctx, ch)

	for dest := range cl.destChainsIDMap {
		var baseHeight uint64 = math.MaxUint64
		// var ns string
		ns := generateNamespcae(baseSeqNumNameSpacePrefix, cl.chainID.String(), dest)
		// TODO : remove this after db migration
		// if cl.name != "ethereum" {
		// 	ns = baseSeqNumNameSpacePrefix + cl.name + dest // ethereum_bsns_base_6694886634403, 3 //ethereum_bsns_ethereum_6694886634403, 200
		// } else {
		// 	ns = baseSeqNumNameSpacePrefix + dest

		// }
		startSeqNum, startHeight := store.GetStartingSeqNumAndHeight(ns)
		cl.metrics.StoredSequenceNo(logger.AttestorName, cl.chainID.String(), dest, float64(startSeqNum))

		if startHeight < baseHeight {
			baseHeight = startHeight
		}

		go cl.feedPacket(ctx, baseHeight, dest, ch)
		go cl.instantFeedPacket(ctx, baseHeight, dest, ch)

	}
	<-ctx.Done()
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
		logger.GetLogger().Info("retrying feed for ", zap.String("chain", cl.name), zap.String("namespace", cl.retryPktNamespaces[index]))
		// retrieve and delete is inefficient approach as it deletes the entry each time it retrieves it
		// for each packet. However with an assumption that packet will rarely reside inside retry namespace
		// this seems to be the efficient approach.
		pkts, err := store.RetrieveAndDeleteNPackets(cl.retryPktNamespaces[index], retrievePacketNum)
		if err != nil {
			logger.GetLogger().Error("error while retrieving retry packets", zap.String("chain", cl.name), zap.Error(err))
			goto indIncr
		}

		for _, pkt := range pkts {
			ch <- pkt
		}

	indIncr:
		index = (index + 1) % len(cl.retryPktNamespaces) // switch index to next destination id
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

		logger.GetLogger().Info("pruning base sequence number namespace of ", zap.String("chain", cl.name),
			zap.String("namespace", cl.baseSeqNamespaces[index]))
		cl.metrics.SetAttestorHealth(logger.AttestorName, cl.chainID.String(), float64(time.Now().Unix()))

		ns := cl.baseSeqNamespaces[index]
		// chainIDStr := strings.ReplaceAll(ns, baseSeqNumNameSpacePrefix, "")
		//TODO: add this after db migration
		trimmmdNamespace := strings.TrimPrefix(ns, baseSeqNumNameSpacePrefix+"_")
		namespaceParts := strings.Split(trimmmdNamespace, "_")
		chainIDStr := namespaceParts[len(namespaceParts)-1]
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
		index = (index + 1) % len(cl.baseSeqNamespaces) // switch index to next destination id
	}
}

// managePacket manages packets that should either be reprocessed or consider as completed.
// It puts packets from retryCh into retry-packet namespace to retry them later.
// If the packets comes inot completedCh, then its sequence number and height will be
// put into sequence number namespace to later on prune base sequence number
func (cl *Client) managePacket(ctx context.Context, completedCh chan *chain.Packet, retryCh chan *chain.Packet) {
	for {
		select {
		case <-ctx.Done():
			return
		case pkt := <-retryCh:
			logger.GetLogger().Info("Adding to retry namespace", zap.Any("packet", pkt))
			// var ns string
			ns := generateNamespcae(retryPacketNamespacePrefix, cl.chainID.String(), pkt.Destination.ChainID.String())
			// TODO: remove this after db migration
			// if cl.name != "ethereum" {
			// 	ns = retryPacketNamespacePrefix + cl.name + pkt.Destination.ChainID.String()
			// } else {
			// 	ns = retryPacketNamespacePrefix + pkt.Destination.ChainID.String()
			// }
			err := store.StoreRetryPacket(ns, pkt)
			if err != nil {
				logger.GetLogger().Error(
					"error while storing packet info",
					zap.Error(err),
					zap.String("namespace", ns))
			}
		case pkt := <-completedCh:
			// var ns string
			ns := generateNamespcae(baseSeqNumNameSpacePrefix, cl.chainID.String(), pkt.Destination.ChainID.String())
			// TODO: remove this after db migration
			// if cl.name != "ethereum" {
			// 	ns = baseSeqNumNameSpacePrefix + cl.name + pkt.Destination.ChainID.String()
			// } else {
			// 	ns = baseSeqNumNameSpacePrefix + pkt.Destination.ChainID.String()
			// }
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
			cl.metrics.UpdateProcessedSequence(logger.AttestorName, pkt.Source.ChainID.String(), pkt.Destination.ChainID.String(), float64(pkt.Sequence))
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
			pkt.Destination.ChainID.Cmp(missedPkt.TargetChainID) == 0 {

			return pkt, nil
		}
	}
	return nil, errors.New("packet not found")
}

func (cl *Client) SetMetrics(metrics *metrics.PrometheusMetrics) {
	cl.metrics = metrics
}

func generateNamespcae(prefix, srcchain, destinationChain string) string {
	return fmt.Sprintf("%s_%s_%s", prefix, srcchain, destinationChain)
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
	var baseSeqNamespace []string
	var retryPktNamespace []string

	nextBlockHeight := make(map[string]uint64, 0)
	instantNextBlockHeight := make(map[string]uint64, 0)
	waitHeights := make(map[string]uint64, 0)
	feedPktDurMap := make(map[string]time.Duration, 0)

	instantPacketDurationMap := make(map[string]time.Duration, 0)
	instantPacketWaitHeightMap := make(map[string]uint64, 0)

	avgBlockGenDur := cfg.AverageBlockGenDur
	if avgBlockGenDur == 0 {
		avgBlockGenDur = defaultavgBlockGenDur
	}

	for destChain, duration := range cfg.DestChains {
		var rns, bns string
		rns = generateNamespcae(retryPacketNamespacePrefix, cfg.ChainID.String(), destChain)
		bns = generateNamespcae(baseSeqNumNameSpacePrefix, cfg.ChainID.String(), destChain)
		// TODO: remove this after db migration
		// if cfg.Name != "ethereum" {
		// 	rns = retryPacketNamespacePrefix + cfg.Name + destChain
		// 	bns = baseSeqNumNameSpacePrefix + cfg.Name + destChain
		// } else {
		// rns = retryPacketNamespacePrefix + destChain // TODO : THE KEY BECAME SAME
		// bns = baseSeqNumNameSpacePrefix + destChain
		// }
		namespaces = append(namespaces, rns, bns)

		retryPktNamespace = append(retryPktNamespace, rns)
		baseSeqNamespace = append(baseSeqNamespace, bns)
		destChainsMap[destChain] = true

		nextBlockHeight[destChain] = duration.StartHeight
		instantNextBlockHeight[destChain] = duration.StartHeight
		feedPktDurMap[destChain] = duration.FeedPacketWaitDuration

		validityWaitDur := duration.PacketValidityWaitDuration
		if validityWaitDur == 0 {
			validityWaitDur = defaultValidityWaitDur
		}

		waitHeight := uint64(validityWaitDur / avgBlockGenDur)
		if waitHeight < duration.FinalityHeight {
			waitHeight = duration.FinalityHeight
		}

		waitHeights[destChain] = waitHeight

		instantPacketDurationMap[destChain] = duration.InstantPktWaitDuration

		iwaitHeight := uint64(duration.InstantPktWaitDuration / avgBlockGenDur)
		instantPacketWaitHeightMap[destChain] = iwaitHeight

	}

	err = store.CreateNamespaces(namespaces)
	if err != nil {
		panic(fmt.Sprintf("failed to create namespaces. Error: %s", err.Error()))
	}

	name := cfg.Name
	if name == "" {
		name = ethereum
	}

	retryPacketWaitDur := cfg.RetryPacketWaitDur
	if retryPacketWaitDur == 0 {
		retryPacketWaitDur = defaultRetryPacketWaitDur
	}

	pruneBaseSeqWaitDur := cfg.PruneBaseSeqNumberWaitDur
	if pruneBaseSeqWaitDur == 0 {
		pruneBaseSeqWaitDur = defaultPruneBaseSeqWaitDur
	}

	return &Client{
		name:                      name,
		address:                   ethCommon.HexToAddress(cfg.BridgeContract),
		eth:                       ethclient,
		bridge:                    bridgeClient,
		destChainsIDMap:           destChainsMap,
		waitHeightMap:             waitHeights,
		chainID:                   cfg.ChainID,
		nextBlockHeightMap:        nextBlockHeight,
		filterTopic:               ethCommon.HexToHash(cfg.FilterTopic),
		feedPktWaitDurMap:         feedPktDurMap,
		retryPacketWaitDur:        retryPacketWaitDur,
		pruneBaseSeqNumberWaitDur: pruneBaseSeqWaitDur,
		baseSeqNamespaces:         baseSeqNamespace,
		retryPktNamespaces:        retryPktNamespace,
		averageBlockGenDur:        avgBlockGenDur,
		instantPacketDurationMap:  instantPacketDurationMap,
		instantWaitHeightMap:      instantPacketWaitHeightMap,
		instantNextBlockHeightMap: instantNextBlockHeight,
	}
}
