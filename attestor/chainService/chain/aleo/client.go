package aleo

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
	aleoRpc "github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain/aleo/rpc"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/common"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/config"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/logger"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/store"
	"go.uber.org/zap"
)

const (
	defaultValidityWaitDur     = time.Hour * 24
	avgBlockGenDur             = time.Second
	outPacket                  = "out_packets"
	aleo                       = "aleo"
	defaultRetryPacketWaitDur  = time.Hour
	defaultPruneBaseSeqWaitDur = time.Hour
	nullString                 = "null"
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
	aleoClient aleoRpc.IAleoRPC
	name       string
	programID  string
	queryUrl   string
	network    string
	chainID    *big.Int
	waitHeight int64
	// map of destChain to sequence number to start from
	destChainsIDMap     map[string]uint64
	validityWaitDur     time.Duration
	retryPacketWaitDur  time.Duration
	pruneBaseSeqWaitDur time.Duration
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
	ns := baseSeqNumNameSpacePrefix + chainID
	startSeqNum, _ := store.GetStartingSeqNumAndHeight(ns)

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

		curMaturedHeight := cl.blockHeightPriorWaitDur(ctx)
		if curMaturedHeight == 0 { // 0 means that there was some error while getting current height
			continue
		}

		switch {
		case availableInHeight == 0:
			time.Sleep(cl.validityWaitDur)
		case availableInHeight > curMaturedHeight:
			dur := time.Duration(availableInHeight-curMaturedHeight) * avgBlockGenDur
			logger.GetLogger().Info("Sleeping ", zap.Duration("duration", dur))
			//TEST Prometheus
			logger.PushLogsToPrometheus(fmt.Sprintf("chainService_aleo_feedPacket_sleeping_duration{client=\"%s\",duration=\"%s\"} 1",cl.name, dur))
			time.Sleep(dur)
		}

		curMaturedHeight = cl.blockHeightPriorWaitDur(ctx)
		if curMaturedHeight == 0 {
			continue
		}

		for { // pull all packets as long as all are matured against waitDuration
			logger.GetLogger().Info("Getting packet", zap.Uint64("seqnum", nextSeqNum))
			//TEST Prometheus
			logger.PushLogsToPrometheus(fmt.Sprintf("chainService_aleo_feedPacket_getting_packet{client=\"%s\",seqnum=\"%d\"} 1",cl.name, nextSeqNum))
			pkt, err := cl.getPktWithSeq(ctx, chainID, nextSeqNum)
			if err != nil {
				if errors.Is(err, common.ErrPacketNotFound{}) {
					availableInHeight = 0
					break
				}

				logger.GetLogger().Error("Error while fetching aleo packets",
					zap.Uint64("Seq_num", nextSeqNum),
					zap.Error(err),
				)
				//TEST Prometheus
				logger.PushLogsToPrometheus(fmt.Sprintf("chainService_aleo_feedPacket_fetching_error{client=\"%s\",seqnum=\"%d\"} 0",cl.name, nextSeqNum))
				goto postFor
			}

			if int64(pkt.Height) > curMaturedHeight {
				availableInHeight = int64(pkt.Height)
				break
			}

			ch <- pkt
			nextSeqNum++

		postFor:
			time.Sleep(time.Second) // todo: wait proper duration to avoid rate limit
		}
	}
}

func (cl *Client) FeedPacket(ctx context.Context, ch chan<- *chain.Packet) {
	go cl.managePacket(ctx)
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
func (cl *Client) blockHeightPriorWaitDur(ctx context.Context) int64 {
	h, err := cl.aleoClient.GetLatestHeight(ctx)
	if err != nil {
		logger.GetLogger().Error("error while getting height", zap.Error(err))
		//TEST Prometheus
		logger.PushLogsToPrometheus(fmt.Sprintf("chainService_aleo_blockHeightPriorWaitDur_error{client=\"%s\"} 0",cl.name))
		return 0
	}
	return h - cl.waitHeight
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
		//TEST Prometheus
		logger.PushLogsToPrometheus(fmt.Sprintf("chainService_aleo_pruneBaseSeqNum_namespace{client=\"%s\",namespace=\"%s\"} 1",cl.name, baseSeqNamespaces[index]))

		var (
			startSeqNum, endSeqNum uint64
			seqHeightRanges        [2][2]uint64
			shouldFetch            bool
		)
		ns := baseSeqNamespaces[index]
		chainID := strings.Replace(ns, baseSeqNumNameSpacePrefix, "", 1)

		seqHeightRanges, shouldFetch = store.PruneBaseSeqNum(ns)
		if !shouldFetch {
			goto indIncr
		}

		startSeqNum, endSeqNum = seqHeightRanges[0][0], seqHeightRanges[0][1]
		for i := startSeqNum; i < endSeqNum; i++ {
			pkt, err := cl.getPktWithSeq(ctx, chainID, i)
			if err != nil {
				logger.GetLogger().Error("error while getting packet.",
					zap.Uint64("seq_num", i), zap.Error(err))
				//TEST Prometheus
				logger.PushLogsToPrometheus(fmt.Sprintf("chainService_aleo_pruneBaseSeqNum_getting_packet_error{client=\"%s\",seqnum=\"%d\"} 0",cl.name, i))
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
		//TEST Prometheus
		logger.PushLogsToPrometheus(fmt.Sprintf("chainService_aleo_retryFeed_namespace{client=\"%s\",namespace=\"%s\"} 1", cl.name, retryPacketNamespaces[index]))

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

// managePacket either keeps the packet received from retryCh channel in the retryPacketNameSpace
// in the event of failure while sending packets to db-service or
// in the baseSequenceNumberNameSpace to the packets received from completedCh channel in the event
// of successful packet delivery to the db-service
func (cl *Client) managePacket(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		case pkt := <-retryCh:
			logger.GetLogger().Info("Adding packet to retry namespace", zap.Any("packet", pkt))
			//TEST Prometheus
			logger.PushLogsToPrometheus(fmt.Sprintf("chainService_aleo_managePacket_retryCh{client=\"%s\",packet=\"%v\"} 1", cl.name,pkt))
			ns := retryPacketNamespacePrefix + pkt.Destination.ChainID.String()
			err := store.StoreRetryPacket(ns, pkt)
			if err != nil {
				logger.GetLogger().Error(
					"error while storing packet info",
					zap.Error(err),
					zap.String("namespace", ns))
				//TEST Prometheus
				logger.PushLogsToPrometheus(fmt.Sprintf("chainService_aleo_managePacket_retryCh_error{client=\"%s\",namespace=\"%s\"} 0",cl.name,ns))
			}
		case pkt := <-completedCh:
			ns := baseSeqNumNameSpacePrefix + pkt.Destination.ChainID.String()
			logger.GetLogger().Info("Updating base seq num",
				zap.String("namespace", ns),
				zap.String("source_chain_id", pkt.Source.ChainID.String()),
				zap.String("dest_chain_id", pkt.Destination.ChainID.String()),
				zap.Uint64("pkt_seq_num", pkt.Sequence),
			)
			//TEST Prometheus
			logger.PushLogsToPrometheus(fmt.Sprintf("chainService_aleo_managePacket_completedCh{client=\"%v\",namespace=\"%s\",sourceChainId=\"%s\",destChainId=\"%s\"pktseqnum=\"%v\"} 1",cl.name,ns,pkt.Source.ChainID.String(),pkt.Destination.ChainID.String(),pkt.Sequence))
			err := store.StoreBaseSeqNum(ns, pkt.Sequence, 0)
			if err != nil {
				logger.GetLogger().Error(
					"error while storing packet info",
					zap.Error(err),
					zap.String("namespace", ns))
				//TEST Prometheus
				logger.PushLogsToPrometheus(fmt.Sprintf("chainService_aleo_managePacket_completedCh_error{client=\"%s\",namespace=\"%s\"} 0",cl.name,ns))
			}
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
	for _, destChainId := range cfg.DestChains {
		rns := retryPacketNamespacePrefix + destChainId
		bns := baseSeqNumNameSpacePrefix + destChainId
		namespaces = append(namespaces, rns, bns)

		retryPacketNamespaces = append(retryPacketNamespaces, rns)
		baseSeqNamespaces = append(baseSeqNamespaces, bns)

		if _, ok := destChainsSeqMap[destChainId]; !ok {
			destChainsSeqMap[destChainId] = 1 // By default start from 1
		}
	}

	err = store.CreateNamespaces(namespaces)
	if err != nil {
		panic(err)
	}

	name := cfg.Name
	if name == "" {
		name = aleo
	}

	validityWaitDur := cfg.PacketValidityWaitDuration
	if validityWaitDur == 0 {
		validityWaitDur = defaultValidityWaitDur
	}

	retryPacketWaitDur := cfg.RetryPacketWaitDur
	if retryPacketWaitDur == 0 {
		retryPacketWaitDur = defaultRetryPacketWaitDur
	}

	pruneBaseSeqWaitDur := cfg.PruneBaseSeqNumberWaitDur
	if pruneBaseSeqWaitDur == 0 {
		pruneBaseSeqWaitDur = defaultPruneBaseSeqWaitDur
	}

	waitHeight := int64(validityWaitDur / avgBlockGenDur)
	if waitHeight < int64(cfg.FinalityHeight) {
		waitHeight = int64(cfg.FinalityHeight)
	}

	return &Client{
		queryUrl:            urlSlice[0],
		network:             urlSlice[1],
		aleoClient:          aleoClient,
		chainID:             cfg.ChainID,
		programID:           cfg.BridgeContract,
		name:                name,
		destChainsIDMap:     destChainsSeqMap,
		waitHeight:          waitHeight,
		validityWaitDur:     validityWaitDur,
		retryPacketWaitDur:  retryPacketWaitDur,
		pruneBaseSeqWaitDur: pruneBaseSeqWaitDur,
	}
}
