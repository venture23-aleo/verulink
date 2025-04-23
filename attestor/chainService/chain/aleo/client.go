package aleo

import (
	"context"
	"errors"
	"math/big"
	"strings"
	"time"

	"github.com/venture23-aleo/verulink/attestor/chainService/chain"
	aleoRpc "github.com/venture23-aleo/verulink/attestor/chainService/chain/aleo/rpc"
	"github.com/venture23-aleo/verulink/attestor/chainService/common"
	"github.com/venture23-aleo/verulink/attestor/chainService/config"
	"github.com/venture23-aleo/verulink/attestor/chainService/logger"
	"github.com/venture23-aleo/verulink/attestor/chainService/metrics"
	"github.com/venture23-aleo/verulink/attestor/chainService/store"

	"go.uber.org/zap"
)

const (
	defaultValidityWaitDur     = time.Hour * 24
	defaultAvgBlockGenDur      = time.Second
	outPacket                  = "out_packets"
	aleo                       = "aleo"
	defaultRetryPacketWaitDur  = time.Hour
	defaultPruneBaseSeqWaitDur = time.Hour
	nullString                 = "null"
	UP                         = 1
	DOWN                       = 0
)

// Namespaces
const (
	baseSeqNumNameSpacePrefix  = "aleo_bsns"
	retryPacketNamespacePrefix = "aleo_rpns"
)

var (
	baseSeqNamespaces     []string
	retryPacketNamespaces []string
)

type Client struct {
	aleoClient     aleoRpc.IAleoRPC
	name           string
	programID      string
	queryUrl       string
	network        string
	chainID        *big.Int
	waitHeightsMap map[string]int64
	// map of destChain to sequence number to start from
	destChainsIDMap     map[string]uint64
	validityWaitDursMap map[string]time.Duration
	retryPacketWaitDur  time.Duration
	pruneBaseSeqWaitDur time.Duration
	avgBlockGenDur      time.Duration
	metrics             *metrics.PrometheusMetrics
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

func (cl *Client) getPktWithSeq(ctx context.Context, dst string, seqNum uint64) (*chain.Packet, error) {
	mappingKey := constructOutMappingKey(dst, seqNum)
	message, err := cl.aleoClient.GetMappingValue(ctx, cl.programID, outPacket, mappingKey)
	if err != nil {
		return nil, err
	}

	if message[mappingKey] == nullString {
		return nil, common.ErrPacketNotFound{
			SeqNum:      seqNum,
			SourceChain: cl.name,
			DestChain:   dst,
		}
	}

	aleoPkt, err := parseMessage(message[mappingKey]) // todo: format with regex and unmarshall with json parser
	if err != nil {
		return nil, err
	}
	return parseAleoPacket(aleoPkt)
}

func (cl *Client) Name() string {
	return cl.name
}

// feedPacket continuously retrieves packets as long as they are matured and sends to channel ch.
// If it finds some immature packet then it will wait accordingly for that packet.
// If there are no more packets then it will wait for given wait duration.
func (cl *Client) feedPacket(ctx context.Context, chainID string, nextSeqNum uint64, ch chan<- *chain.Packet) {
	ns := generateNamespcae(baseSeqNumNameSpacePrefix,cl.chainID.String(),chainID)
	startSeqNum, _ := store.GetStartingSeqNumAndHeight(ns)
	cl.metrics.StoredSequenceNo(logger.AttestorName, cl.chainID.String(), chainID, float64(startSeqNum))

	if nextSeqNum < startSeqNum {
		nextSeqNum = startSeqNum
	}

	if nextSeqNum == 0 {
		nextSeqNum = 1 // sequence number starts from 1
	}

	// setting availableInHeight to 1 will avoid waiting from given wait duration.
	// If there are no any packets then it will anyway be set to 0
	availableInHeight := int64(1)
	for {
		select {
		case <-ctx.Done():
		default:
		}

		curMaturedHeight := cl.blockHeightPriorWaitDur(ctx, chainID)
		if curMaturedHeight == 0 { // 0 means that there was some error while getting current height
			continue
		}

		switch {
		case availableInHeight == 0:
			logger.GetLogger().Info("Sleeping aleo client of", zap.String("chainId", chainID), zap.Duration("duration", cl.validityWaitDursMap[chainID]))
			time.Sleep(cl.validityWaitDursMap[chainID])
		case availableInHeight > curMaturedHeight:
			dur := time.Duration(availableInHeight-curMaturedHeight) * cl.avgBlockGenDur
			logger.GetLogger().Info("Sleeping aleo client of", zap.String("chainId", chainID), zap.Duration("duration", dur))
			time.Sleep(dur)
		}

		curMaturedHeight = cl.blockHeightPriorWaitDur(ctx, chainID)
		if curMaturedHeight == 0 {
			continue
		}

		for { // pull all packets as long as all are matured against waitDuration
			logger.GetLogger().Info("Getting packet for", zap.String("chainId", chainID), zap.Uint64("seqnum", nextSeqNum))
			pkt, err := cl.getPktWithSeq(ctx, chainID, nextSeqNum)
			if err != nil {
				if errors.Is(err, common.ErrPacketNotFound{}) {
					availableInHeight = 0
					break
				}

				logger.GetLogger().Error("Error while fetching aleo packets for", zap.String("chainId", chainID),
					zap.Uint64("Seq_num", nextSeqNum),
					zap.Error(err),
				)
				goto postFor
			}

			if int64(pkt.Height) > curMaturedHeight {
				availableInHeight = int64(pkt.Height)
				break
			}
			cl.metrics.AddInPackets(logger.AttestorName, cl.chainID.String(), pkt.Destination.ChainID.String())
			ch <- pkt
			nextSeqNum++

		postFor:
			time.Sleep(time.Second) // todo: wait proper duration to avoid rate limit
		}
	}
}

func (cl *Client) FeedPacket(ctx context.Context, ch chan<- *chain.Packet, completedCh chan *chain.Packet, retryCh chan *chain.Packet) {
	go cl.managePacket(ctx, completedCh, retryCh)
	go cl.pruneBaseSeqNum(ctx, ch)
	go cl.retryFeed(ctx, ch)

	for chainID, nextSeqNum := range cl.destChainsIDMap {
		go cl.feedPacket(ctx, chainID, nextSeqNum, ch)
	}
	<-ctx.Done()
}

// blockHeightPriorWaitDur returns matured height that signifies the packets formed
// below this height is ready to be processed.
// If any error occurs it logs error and returns 0. Caller should assume error occurrence
// if it receives 0.
func (cl *Client) blockHeightPriorWaitDur(ctx context.Context, destChaindId string) int64 {
	h, err := cl.aleoClient.GetLatestHeight(ctx)
	if err != nil {
		logger.GetLogger().Error("error while getting height", zap.Error(err))
		cl.metrics.UpdateAleoRPCStatus(logger.AttestorName, cl.chainID.String(), DOWN)
		return 0
	}
	cl.metrics.UpdateAleoRPCStatus(logger.AttestorName, cl.chainID.String(), UP)
	waitHeight := cl.waitHeightsMap[destChaindId]
	return h - waitHeight
}

// pruneBaseSeqNum updates the sequence number upto which the attestor has processed all the
// outgoing packets of the source chain. The first entry of the baseSeqNum bucket represents
// the base sequence number
func (cl *Client) pruneBaseSeqNum(ctx context.Context, ch chan<- *chain.Packet) {
	// also fill gap and put in retry feed
	ticker := time.NewTicker(cl.pruneBaseSeqWaitDur)
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
		logger.GetLogger().Info("pruning base sequence number", zap.String("namespace", baseSeqNamespaces[index]))
		cl.metrics.SetAttestorHealth(logger.AttestorName, cl.chainID.String(), float64(time.Now().Unix()))

		var (
			startSeqNum, endSeqNum uint64
			seqHeightRanges        [2][2]uint64
			shouldFetch            bool
		)
		ns := baseSeqNamespaces[index]
		// chainID := strings.Replace(ns, baseSeqNumNameSpacePrefix, "", 1)
		trimmmdNamespace := strings.TrimPrefix(ns, baseSeqNumNameSpacePrefix+"_")
		namespaceParts := strings.Split(trimmmdNamespace, "_")
		chainIDStr := namespaceParts[len(namespaceParts)-1]
		chainID := new(big.Int)
		chainID.SetString(chainIDStr, 10)
		seqHeightRanges, shouldFetch = store.PruneBaseSeqNum(ns)
		if !shouldFetch {
			goto indIncr
		}

		startSeqNum, endSeqNum = seqHeightRanges[0][0], seqHeightRanges[0][1]
		for i := startSeqNum; i < endSeqNum; i++ {
			pkt, err := cl.getPktWithSeq(ctx, chainIDStr, i)
			if err != nil {
				logger.GetLogger().Error("error while getting packet.",
					zap.String("chainId", chainIDStr), zap.Uint64("seq_num", i), zap.Error(err))
				continue
			}
			ch <- pkt
		}
	indIncr:
		index++
	}
}

// retryFeed periodically fetches the packets in the "retryPacketNamespace" and sends them
// to channel ch. It also deletes those packets entry from the namespace.
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

		if index == len(retryPacketNamespaces) {
			index = 0
		}
		logger.GetLogger().Info("retrying aleo feeds", zap.String("namespace", retryPacketNamespaces[index]))

		// retrieve and delete is inefficient approach as it deletes the entry each time it retrieves it
		// for each packet. However with an assumption that packet will rarely reside inside retry namespace
		// this is the most efficient approach.
		pkts, err := store.RetrieveAndDeleteNPackets(retryPacketNamespaces[index], 10)
		if err != nil {
			logger.GetLogger().Error("error while retrieving retry packets", zap.Error(err))
			goto indIncr
		}
		for _, pkt := range pkts {
			ch <- pkt
		}

	indIncr:
		index++
	}
}

// managePacket either keeps the packet received from retryCh channel in the retryPacketNameSpace
// in the event of failure while sending packets to db-service or
// in the baseSequenceNumberNameSpace to the packets received from completedCh channel in the event
// of successful packet delivery to the db-service
func (cl *Client) managePacket(ctx context.Context, completedCh chan *chain.Packet, retryCh chan *chain.Packet) {
	for {
		select {
		case <-ctx.Done():
			return
		case pkt := <-retryCh:
			logger.GetLogger().Info("Adding packet to retry namespace", zap.Any("packet", pkt))
			ns := generateNamespcae(retryPacketNamespacePrefix, cl.chainID.String(), pkt.Destination.ChainID.String())
			err := store.StoreRetryPacket(ns, pkt)
			if err != nil {
				logger.GetLogger().Error(
					"error while storing packet info",
					zap.Error(err),
					zap.String("namespace", ns))
			}
		case pkt := <-completedCh:
			ns := generateNamespcae(baseSeqNumNameSpacePrefix, cl.chainID.String(), pkt.Destination.ChainID.String())
			logger.GetLogger().Info("Updating base seq num",
				zap.String("namespace", ns),
				zap.String("source_chain_id", pkt.Source.ChainID.String()),
				zap.String("dest_chain_id", pkt.Destination.ChainID.String()),
				zap.Uint64("pkt_seq_num", pkt.Sequence),
			)
			err := store.StoreBaseSeqNum(ns, pkt.Sequence, 0)
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

func (cl *Client) GetMissedPacket(
	ctx context.Context, missedPkt *chain.MissedPacket) (
	*chain.Packet, error) {

	pkt, err := cl.getPktWithSeq(ctx, missedPkt.TargetChainID.String(), missedPkt.SeqNum)
	if err != nil {
		return nil, err
	}
	return pkt, nil
}

func (cl *Client) SetMetrics(metrics *metrics.PrometheusMetrics) {
	cl.metrics = metrics
}

// NewClient initializes Client and returns the interface to chain.IClient
func NewClient(cfg *config.ChainConfig) chain.IClient {
	urlSlice := strings.Split(cfg.NodeUrl, "|")
	if len(urlSlice) != 2 {
		panic("invalid format. Expected format:  <rpc_endpoint>|<network>:: example: http://localhost:3030|testnet3")
	}

	aleoClient, err := aleoRpc.NewRPC(urlSlice[0], urlSlice[1])
	if err != nil {
		panic("failed to create aleoclient")
	}

	destChainsSeqMap := make(map[string]uint64, 0)
	for k, v := range cfg.StartSeqNum {
		destChainsSeqMap[k] = v
	}

	var namespaces []string

	validityWaitDursMap := make(map[string]time.Duration, 0)
	waitHeightsMap := make(map[string]int64, 0)

	avgBlockGenDur := cfg.AverageBlockGenDur
	if avgBlockGenDur == 0 {
		avgBlockGenDur = defaultAvgBlockGenDur
	}

	for destChainId, duration := range cfg.DestChains {
		rns := generateNamespcae(retryPacketNamespacePrefix, cfg.ChainID.String(), destChainId)
		bns := generateNamespcae(baseSeqNumNameSpacePrefix, cfg.ChainID.String(), destChainId)
		// TODO: remove in code cleanup
		// rns := retryPacketNamespacePrefix + destChainId
		// bns := baseSeqNumNameSpacePrefix + destChainId
		namespaces = append(namespaces, rns, bns)

		retryPacketNamespaces = append(retryPacketNamespaces, rns)
		baseSeqNamespaces = append(baseSeqNamespaces, bns)

		if _, ok := destChainsSeqMap[destChainId]; !ok {
			destChainsSeqMap[destChainId] = 1 // By default start from 1
		}

		validityWaitDursMap[destChainId] = duration.PacketValidityWaitDuration
		if validityWaitDursMap[destChainId] == 0 {
			validityWaitDursMap[destChainId] = defaultValidityWaitDur
		}

		waitHeight := int64(validityWaitDursMap[destChainId] / avgBlockGenDur)
		if waitHeight < int64(duration.FinalityHeight) {
			waitHeight = int64(duration.FinalityHeight)
		}

		waitHeightsMap[destChainId] = waitHeight

	}

	err = store.CreateNamespaces(namespaces)
	if err != nil {
		panic(err)
	}

	name := cfg.Name
	if name == "" {
		name = aleo
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
		queryUrl:            urlSlice[0],
		network:             urlSlice[1],
		aleoClient:          aleoClient,
		chainID:             cfg.ChainID,
		programID:           cfg.BridgeContract,
		name:                name,
		destChainsIDMap:     destChainsSeqMap,
		retryPacketWaitDur:  retryPacketWaitDur,
		pruneBaseSeqWaitDur: pruneBaseSeqWaitDur,
		avgBlockGenDur:      avgBlockGenDur,
		validityWaitDursMap: validityWaitDursMap,
		waitHeightsMap:      waitHeightsMap,
	}
}
