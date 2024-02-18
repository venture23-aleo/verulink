package ethereum

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"go.uber.org/zap"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
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
	defaultHeightDifferenceForFilterLogs = 100
	defaultValidityWaitDur               = 24 * time.Hour
	// defaultFeedPktWaitDur sets ticker in FeedPacket. It is chosen to be two-third of time taken
	// for blockchain to produce defaultHeightDifferenceForFilterLogs number of blocks so that
	// it shall never lag with blockchain.
	defaultFeedPktWaitDur      = defaultHeightDifferenceForFilterLogs * avgBlockGenDur * 2 / 3
	avgBlockGenDur             = time.Second * 12
	defaultRetryPacketWaitDur  = time.Hour * 12
	defaultPruneBaseSeqWaitDur = time.Hour * 6
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

type iBridgeClient interface {
	ParsePacketDispatched(log types.Log) (*abi.BridgePacketDispatched, error)
	IsPacketConsumed(opts *bind.CallOpts, _sequence *big.Int) (bool, error)
}

type bridgeClient struct {
	bridge *abi.Bridge
}

func NewBridgeClient(contractAddress ethCommon.Address, ethClient *ethclient.Client) (iBridgeClient, error) {
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

func (brcl *bridgeClient) IsPacketConsumed(opts *bind.CallOpts, _sequence *big.Int) (bool, error) {
	consumed, err := brcl.bridge.IsPacketConsumed(opts, _sequence)
	if err != nil {
		return false, err
	}
	return consumed, nil
}

type Client struct {
	name                      string
	address                   ethCommon.Address
	eth                       ethClientI
	bridge                    iBridgeClient
	destChainsMap             map[string]bool
	nextBlockHeight           uint64
	chainID                   *big.Int
	filterTopic               ethCommon.Hash
	waitHeight                uint64
	feedPktWaitDur            time.Duration
	retryPacketWaitDur        time.Duration
	pruneBaseSeqNumberWaitDur time.Duration
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

// blockHeightPriorWaitDur returns block height from which events logs can be safely parsed.
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

func (cl *Client) filterPacketLogs(ctx context.Context, fromHeight, toHeight uint64) ([]*chain.Packet, error) {
	logs, err := cl.eth.FilterLogs(ctx, fromHeight, toHeight, cl.address, cl.filterTopic)
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
					if _, ok := cl.destChainsMap[pkt.Destination.ChainID.String()]; ok {
						ch <- pkt
					}
				}
				cl.nextBlockHeight += endHeight + 1
			}
		}
	}
}

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
		index = (index + 1) % len(retryPacketNamespaces)
	}
}

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

func NewClient(cfg *config.ChainConfig, _ map[string]*big.Int) chain.IClient {
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
		destChainsMap:             destChainsMap,
		waitHeight:                waitHeight,
		chainID:                   cfg.ChainID,
		nextBlockHeight:           cfg.StartHeight,
		filterTopic:               ethCommon.HexToHash(cfg.FilterTopic),
		feedPktWaitDur:            feedPktWaitDur,
		retryPacketWaitDur:        retryPacketWaitDur,
		pruneBaseSeqNumberWaitDur: pruneBaseSeqWaitDur,
	}
}
