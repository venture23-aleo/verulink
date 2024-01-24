package ethereum

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"math/big"
	"time"

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
	bridge            *abi.Bridge
	minRequiredGasFee uint64
	waitDur           time.Duration
	nextBlockHeight   uint64
	chainID           *big.Int
	rpcEndpoint       string
}

func (cl *Client) Name() string {
	return cl.name
}

func (cl *Client) GetSourceChain() (string, string) {
	return cl.name, cl.address
}

func (cl *Client) GetChainID() *big.Int {
	return cl.chainID
}

func (cl *Client) createNamespaces() error {
	err := store.CreateNamespace(baseSeqNumNameSpace)
	if err != nil {
		return err
	}
	return store.CreateNamespace(retryPacketNamespace)
}

func (cl *Client) parseBlock(ctx context.Context, height uint64) (pkts []*chain.Packet, err error) {
	fmt.Println("parse eth block")
	sc := ethCommon.HexToAddress(cl.address)

	ctxBlk, cancel := context.WithCancel(ctx)
	defer cancel()

	block, err := cl.eth.BlockByNumber(ctxBlk, big.NewInt(int64(height)))
	if err != nil {
		fmt.Println(err)
		return nil, err
	}

	ctxRecpt, cancel := context.WithCancel(ctx)
	defer cancel()
	receipts, err := getTxReceipts(ctxRecpt, cl.eth, block)
	if err != nil {
		return nil, err
	}
	packets, err := getRelayReceipts(cl.bridge, sc, receipts)
	if err != nil {
		return nil, err
	}
	return packets, nil
}

func getRelayReceipts(bridgeClient *abi.Bridge, contract ethCommon.Address, receipts ethTypes.Receipts) ([]*chain.Packet, error) {
	packets := []*chain.Packet{}
	for _, receipt := range receipts {
		for _, log := range receipt.Logs {
			if !bytes.Equal(log.Address.Bytes(), contract.Bytes()) {
				continue
			}
			packetDispatched, err := bridgeClient.ParsePacketDispatched(*log)
			if err != nil {
				return nil, err
			}
			commonPacket := &chain.Packet{
				Version: packetDispatched.Packet.Version,
				Sequence: packetDispatched.Packet.Sequence,
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
					SenderAddress: string(packetDispatched.Packet.Message.SenderAddress.Bytes()),
					Amount: packetDispatched.Packet.Message.Amount,
					ReceiverAddress: packetDispatched.Packet.Message.ReceiverAddress,
				},
				Height: packetDispatched.Packet.Height,
			}
			packets = append(packets, commonPacket)
		}
	}
	return packets, nil
}

func getTxReceipts(ctx context.Context, ethClient *ethclient.Client, hb *ethTypes.Block) (ethTypes.Receipts, error) {
	txhs := hb.Transactions()
	receipts := make(ethTypes.Receipts, 0, len(txhs))

	type receiptStruct struct {
		txHash  ethCommon.Hash
		receipt *ethTypes.Receipt
		err     error
	}
	receiptCh := make(chan *receiptStruct, len(txhs))
	queryCh := make(chan *receiptStruct, cap(receiptCh))

	for _, v := range hb.Transactions() {
		queryCh <- &receiptStruct{txHash: v.Hash(), receipt: nil, err: nil}
	}
	counter := 0

outerFor:
	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		default:
			for q := range queryCh {
				switch {
				case q.err != nil:
					counter++
					fmt.Println("counter is ", counter)
					q.err = nil
					q.receipt = nil
					queryCh <- q
				case q.receipt != nil:
					receipts = append(receipts, q.receipt)
					if len(receipts) == cap(queryCh) {
						fmt.Println("when does it close??")
						close(queryCh)
						break outerFor
					} else {
						continue
					}
				default:
					go func(txReceipt *receiptStruct) {
						r, err := ethClient.TransactionReceipt(ctx, txReceipt.txHash)
						if err != nil || r == nil {
							txReceipt.err = errors.Join(errors.New("failed"), err)
							queryCh <- txReceipt
						}
						txReceipt.receipt = r
						queryCh <- txReceipt
					}(q)
				}

			}
		}
	}
	return receipts, nil
}

func (cl *Client) FeedPacket(ctx context.Context, ch chan<- *chain.Packet) {
	err := cl.createNamespaces()
	if err != nil {
		panic(err)
	}

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
			pkts, err := cl.parseBlock(ctx, i)
			if err != nil {
				i--
				continue // retry the same block if err
			}
			for _, pkt := range pkts {
				if pkt.Sequence.Uint64() == endSeqNum {
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
				_ = err
				// TODO: log error
			}
		case pkt := <-completedCh:
			err := store.StoreBaseSeqNum(baseSeqNumNameSpace, pkt.Sequence.Uint64(), pkt.Height.Uint64())
			if err != nil {
				_ = err
				// TODO: log error
			}
		}
	}
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
