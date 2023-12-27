package ethereum

import (
	"context"
	"fmt"
	"math/big"
	"time"

	ethBind "github.com/ethereum/go-ethereum/accounts/abi/bind"
	ethTypes "github.com/ethereum/go-ethereum/core/types"

	abi "github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain/ethereum/abi"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/rpc"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

const (
	DefaultFinalizingHeight = 64
	BlockGenerationTime     = time.Second * 12
	DefaultRetryCount       = 5
	Ethereum                = "ethereum"
	DefaultGasLimit         = 1200000
	defaultGasPrice         = 130000000000
	defaultSendTxTimeout    = time.Second * 15
	defaultReadTimeout      = 50 * time.Second
)

type source struct {
	sourceName    string
	sourceAddress string
}

type Client struct {
	src               *source
	eth               *ethclient.Client
	bridge            *abi.Bridge
	minRequiredGasFee uint64
	finalizeHeight    uint64
	blockGenTime      time.Duration
	chainID           uint32
	chainCfg          *relay.ChainConfig
	wallet            common.Wallet
}

func (cl *Client) GetPktWithSeq(ctx context.Context, dst uint32, seqNum uint64) (*chain.Packet, error) {
	fmt.Println("reached in getting packet with seq number ethereum", dst, seqNum)
	chainID := &big.Int{}
	chainID.SetUint64(uint64(dst))
	sequenceNumber := &big.Int{}
	sequenceNumber.SetUint64(seqNum)

	ethpacket, err := cl.bridge.OutgoingPackets(&ethBind.CallOpts{Context: ctx}, chainID, sequenceNumber)
	if err != nil {
		return nil, err
	}

	packet := &chain.Packet{
		Version: ethpacket.Version.Uint64(),
		Destination: &chain.NetworkAddress{
			ChainID: ethpacket.DestTokenService.ChainId.Uint64(),
			Address: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
		},
		Source: &chain.NetworkAddress{
			ChainID: ethpacket.SourceTokenService.ChainId.Uint64(),
			Address: string(ethpacket.SourceTokenService.Addr.Bytes()),
		},
		Sequence: ethpacket.Sequence.Uint64(),
		Message: &chain.Message{
			DestTokenAddress: "aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn",
			Amount:           ethpacket.Message.Amount,
			ReceiverAddress:  ethpacket.Message.ReceiverAddress,
		},
		Height: ethpacket.Height.Uint64(),
	}
	return packet, nil
}

func (cl *Client) GetPktsWithSeqAndInSameHeight(ctx context.Context, seqNum uint64) ([]*chain.Packet, error) {
	packets := make([]*chain.Packet, 0)
	return packets, nil
}

func (cl *Client) AttestMessages(opts *ethBind.TransactOpts, packet abi.PacketLibraryInPacket) (tx *ethTypes.Transaction, err error) {
	fmt.Println("attestation")
	tx, err = cl.bridge.ReceivePacket(opts, packet)
	return
}

// SendAttestedPacket sends packet from source chain to target chain
func (cl *Client) SendPacket(ctx context.Context, m *chain.Packet) error {
	newTransactOpts := func() (*ethBind.TransactOpts, error) {
		fmt.Println(cl.wallet.(*common.EVMWallet).SKey())
		txo, err := ethBind.NewKeyedTransactorWithChainID(cl.wallet.(*common.EVMWallet).SKey(), big.NewInt(11155111))
		if err != nil {
			return nil, err
		}
		ctx, cancel := context.WithTimeout(context.Background(), defaultReadTimeout)
		defer cancel()
		txo.GasPrice, _ = cl.SuggestGasPrice(ctx)
		txo.GasLimit = uint64(DefaultGasLimit)
		// txo.Nonce = big.NewInt(1)
		return txo, nil
	}

	txOpts, err := newTransactOpts()
	if err != nil {
		fmt.Println(err)
		return err
	}

	txOpts.Context = context.Background()
	txOpts.GasLimit = DefaultGasLimit

	txOpts.GasPrice = big.NewInt(defaultGasPrice)
	// send transaction here
	packet := &abi.PacketLibraryInPacket{
		Version:  big.NewInt(int64(m.Version)),
		Sequence: big.NewInt(int64(m.Sequence)),
		SourceTokenService: abi.PacketLibraryOutNetworkAddress{
			ChainId: big.NewInt(2),
			Addr:    m.Source.Address,
		},
		DestTokenService: abi.PacketLibraryInNetworkAddress{
			ChainId: big.NewInt(1),
			Addr:    ethCommon.HexToAddress(m.Destination.Address),
		},
		Message: abi.PacketLibraryInTokenMessage{
			DestTokenAddress: ethCommon.HexToAddress(m.Message.DestTokenAddress),
			Amount:           m.Message.Amount,
			ReceiverAddress:  ethCommon.HexToAddress(m.Message.ReceiverAddress),
		},
		Height: big.NewInt(int64(m.Height)),
	}

	transacton, err := cl.AttestMessages(txOpts, *packet)
	if err != nil {
		fmt.Println(err)
		return err
		// panic("err")
		// m.RetryCount++
		// if m.RetryCount < DefaultRetryCount {
		// 	fmt.Println("putting the block in state retry block", m.DepartureBlock)
		// 	if _, ok := s.RetryQueue[m.DepartureBlock]; !ok {
		// 		s.RetryQueue[m.DepartureBlock] = m
		// 	}
		// } else {
		// 	depBlock := strconv.Itoa(int(m.DepartureBlock))
		// 	fmt.Println("putting the block in the db", m.DepartureBlock)
		// 	packet, _ := store.GetRetryPacket(Ethereum, depBlock)
		// 	if packet != nil {
		// 		return nil
		// 	}
		// 	err := store.StoreRetryPacket(Ethereum, depBlock, m)
		// 	if err != nil {
		// 		return err
		// 	}
		// 	delete(s.RetryQueue, m.DepartureBlock)
		// }
		// fmt.Println("couldnot send ", m.DepartureBlock, m.RetryCount)
	}
	fmt.Println(transacton.Hash())
	// store.DeleteRetryPacket(Ethereum, strconv.Itoa(int(m.DepartureBlock)))
	// delete(s.RetryQueue, m.DepartureBlock)
	// time.Sleep(5 * time.Second)
	// s.SentPackets = append(s.SentPackets, m.DepartureBlock)
	fmt.Println("sent packets from eth", transacton.Hash())
	return nil
}

func (cl *Client) GetLatestHeight(ctx context.Context) (uint64, error) {
	return 0, nil
}

func (cl *Client) IsPktTxnFinalized(ctx context.Context, pkt *chain.Packet) (bool, error) {
	return false, nil
}

func (cl *Client) CurHeight() uint64 {
	return 0
}

func (cl *Client) GetFinalityHeight() uint64 {
	return cl.finalizeHeight
}

func (cl *Client) GetBlockGenTime() time.Duration {
	return cl.blockGenTime
}

func (cl *Client) GetDestChains() ([]string, error) {
	return []string{"aleo"}, nil
}

func (cl *Client) GetChainEvent(ctx context.Context) (*chain.ChainEvent, error) {
	return nil, nil
}

func (cl *Client) GetMinReqBalForMakingTxn() uint64 {
	return cl.minRequiredGasFee
}

func (cl *Client) GetWalletBalance(ctx context.Context) (uint64, error) {
	return 0, nil
}

func (cl *Client) Name() string {
	return "Ethereum"
}

func (cl *Client) GetSourceChain() (name, address string) {
	name, address = cl.src.sourceName, cl.src.sourceAddress
	return
}

func (cl *Client) GetChainID() uint32 {
	return cl.chainID
}

func (cl *Client) SuggestGasPrice(ctx context.Context) (*big.Int, error) {
	return cl.eth.SuggestGasPrice(ctx)
}

func Wallet(path string) (common.Wallet, error) {
	wallet, err := relay.LoadWalletConfig(path)
	if err != nil {
		return nil, err
	}
	return wallet, nil
}

func NewClient(cfg *relay.ChainConfig) relay.IClient {
	/*
		Initialize eth client and panic if any error occurs.
		nextSeq should start from 1
	*/

	rpc, err := rpc.Dial(cfg.NodeUrl)
	if err != nil {
		return nil
	}

	ethclient := ethclient.NewClient(rpc)
	contractAddress := ethCommon.HexToAddress(cfg.BridgeContract)
	bridgeClient, err := abi.NewBridge(contractAddress, ethclient)
	if err != nil {
		return nil
	}

	wallet, err := Wallet(cfg.WalletPath)
	if err != nil {
		return nil
	}
	return &Client{
		src: &source{
			sourceName:    cfg.Name,
			sourceAddress: cfg.BridgeContract,
		},
		eth:            ethclient,
		bridge:         bridgeClient,
		finalizeHeight: DefaultFinalizingHeight,
		blockGenTime:   BlockGenerationTime,
		chainID:        cfg.ChainID,
		chainCfg:       cfg,
		wallet:         wallet,
	}
}
