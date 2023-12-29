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
	defaultFinalizingHeight = 2
	blockGenerationTime     = time.Second * 12
	defaultRetryCount       = 5
	ethereum                = "ethereum"
	defaultGasLimit         = 1500000
	defaultGasPrice         = 130000000000
	defaultSendTxTimeout    = time.Second * 15
	defaultReadTimeout      = 50 * time.Second
)

type Client struct {
	name              string
	address           string
	eth               *ethclient.Client
	bridge            *abi.Bridge
	minRequiredGasFee uint64
	finalizeHeight    uint64
	blockGenTime      time.Duration
	chainID           uint32
	chainCfg          *relay.ChainConfig
	wallet            common.Wallet
}

func (cl *Client) GetPktWithSeq(ctx context.Context, dstChainID uint32, seqNum uint64) (*chain.Packet, error) {
	chainID := &big.Int{}
	chainID.SetUint64(uint64(dstChainID))
	sequenceNumber := &big.Int{}
	sequenceNumber.SetUint64(seqNum)

	ethpacket, err := cl.bridge.OutgoingPackets(&ethBind.CallOpts{Context: ctx}, chainID, sequenceNumber)
	if err != nil {
		return nil, err
	}

	packet := &chain.Packet{
		Version: ethpacket.Version.Uint64(),
		Destination: chain.NetworkAddress{
			ChainID: ethpacket.DestTokenService.ChainId.Uint64(),
			Address: ethpacket.DestTokenService.Addr,
		},
		Source: chain.NetworkAddress{
			ChainID: ethpacket.SourceTokenService.ChainId.Uint64(),
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

func (cl *Client) AttestMessages(opts *ethBind.TransactOpts, packet abi.PacketLibraryInPacket) (tx *ethTypes.Transaction, err error) {
	fmt.Println("attestation")
	tx, err = cl.bridge.ReceivePacket(opts, packet)
	return
}

// SendAttestedPacket sends packet from source chain to target chain
func (cl *Client) SendPacket(ctx context.Context, m *chain.Packet) error {
	newTransactOpts := func() (*ethBind.TransactOpts, error) {
		fmt.Println(cl.wallet.(*common.EVMWallet).SKey())
		txo, err := ethBind.NewKeyedTransactorWithChainID(cl.wallet.(*common.EVMWallet).SKey(), big.NewInt(11155111)) // todo: chainid is required here, handle this through config?
		if err != nil {
			return nil, err
		}
		ctx, cancel := context.WithTimeout(context.Background(), defaultReadTimeout)
		defer cancel()
		txo.GasPrice, _ = cl.SuggestGasPrice(ctx)
		txo.GasLimit = uint64(defaultGasLimit)
		// txo.Nonce = big.NewInt(1)
		return txo, nil
	}

	txOpts, err := newTransactOpts()
	if err != nil {
		fmt.Println(err)
		return err
	}

	txOpts.Context = context.Background()
	txOpts.GasLimit = defaultGasLimit

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

func (cl *Client) CurHeight(ctx context.Context) uint64 {
	height, err := cl.eth.BlockNumber(ctx)
	if err != nil {
		return 0
	}
	return height
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
	return cl.name
}

func (cl *Client) GetSourceChain() (name, address string) {
	name, address = cl.name, cl.address
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
	name := cfg.Name
	finalizeHeight := cfg.FinalityHeight
	if name == "" {
		name = ethereum
	}
	if finalizeHeight == 0 {
		finalizeHeight = defaultFinalizingHeight
	}
	// todo: handle start height from stored height if start height in the config is 0
	return &Client{
		name:           name,
		address:        cfg.BridgeContract,
		eth:            ethclient,
		bridge:         bridgeClient,
		finalizeHeight: defaultFinalizingHeight,
		blockGenTime:   blockGenerationTime,
		chainID:        cfg.ChainID,
		chainCfg:       cfg,
		wallet:         wallet,
	}
}
