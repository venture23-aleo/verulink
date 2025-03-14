package ethereum

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"os"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/accounts/keystore"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/rpc"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/venture23-aleo/attestor/e2etest/chains/ethereum/abi"
	"github.com/venture23-aleo/attestor/e2etest/common"
)

const (
	txMaxDataSize        = 8 * 1024 // 8 KB
	txOverheadScale      = 0.01     // base64 encoding overhead 0.36, rlp and other fields 0.01
	defaultTxSizeLimit   = txMaxDataSize / (1 + txOverheadScale)
	defaultSendTxTimeout = 2 * time.Minute
	defaultGasPrice      = 130000000000
	maxGasPriceBoost     = 10.0
	defaultReadTimeout   = 50 * time.Second //
	defaultGasLimit      = 1500000
)

type Client struct {
	name                string
	url                 string
	ethClient           *ethclient.Client
	bridgeAddress       ethCommon.Address
	tokenServiceAddress ethCommon.Address
	usdcAddress         ethCommon.Address
	bridge              *abi.Bridge
	tokenService        *abi.TokenService
	usdc                *abi.USDC
	privateKey          *ecdsa.PrivateKey
	walletAddress       ethCommon.Address
}

func (c *Client) CreatePacket() {

}

func NewClient(cfg *common.ChainConfig) *Client {
	// rpc, err := rpc.Dial("http://localhost:3001/")
	rpc, err := rpc.Dial(cfg.NodeUrl)
	if err != nil {
		panic(err)
	}

	ethClient := ethclient.NewClient(rpc)

	bridgeContractAddress := ethCommon.HexToAddress(cfg.BridgeContractAddress)
	tokenServiceContractAddress := ethCommon.HexToAddress(cfg.TokenServiceContractAddress)
	usdcContractAddress := ethCommon.HexToAddress(cfg.USDCContractAddress)

	bridgeClient, err := abi.NewBridge(bridgeContractAddress, ethClient)
	if err != nil {
		panic(fmt.Sprintf("failed to create ethereum bridge client. Error: %s", err.Error()))
	}

	tokenServiceClient, err := abi.NewTokenService(tokenServiceContractAddress, ethClient)
	if err != nil {
		panic(fmt.Sprintf("failed to create ethereum bridge client. Error: %s", err.Error()))
	}

	usdcClient, err := abi.NewUSDC(usdcContractAddress, ethClient)
	if err != nil {
		panic(err)
	}

	privateKey := loadWallet(cfg.WalletPath)

	return &Client{
		name:                cfg.Name,
		bridgeAddress:       bridgeContractAddress,
		tokenServiceAddress: tokenServiceContractAddress,
		bridge:              bridgeClient,
		tokenService:        tokenServiceClient,
		url:                 cfg.NodeUrl,
		privateKey:          privateKey,
		ethClient:           ethClient,
		usdc:                usdcClient,
		usdcAddress:         usdcContractAddress,
	}
}

func (c *Client) SuggestGasPrice(ctx context.Context) (*big.Int, error) {
	return c.ethClient.SuggestGasPrice(ctx)
}

func (c *Client) buildTransactionOpts(ctx context.Context, chainId string) (*bind.TransactOpts, error) {
	bigIntChainId := new(big.Int)
	if _, success := bigIntChainId.SetString(chainId, 10); !success {
		return nil, fmt.Errorf("invalid chain id")
	}

	newTransactOpts := func() (*bind.TransactOpts, error) {
		txo, err := bind.NewKeyedTransactorWithChainID(c.privateKey, bigIntChainId)
		if err != nil {
			return nil, err
		}
		ctx, cancel := context.WithTimeout(context.Background(), defaultSendTxTimeout) // timeout
		defer cancel()
		txo.GasPrice, _ = c.SuggestGasPrice(ctx)
		txo.GasLimit = uint64(defaultGasLimit) // default gas limit
		return txo, nil
	}

	txOpts, err := newTransactOpts()
	if err != nil {
		return nil, err
	}

	txOpts.Context = ctx
	txOpts.GasLimit = defaultGasLimit

	txOpts.GasPrice, _ = c.SuggestGasPrice(ctx)
	return txOpts, nil
}

func (c *Client) TransferEther(ctx context.Context) error {
	txOpts, err := c.buildTransactionOpts(ctx, "11155111")
	if err != nil {
		return err
	}

	value := new(big.Int)
	value, ok := value.SetString("500000000000000000", 10)
	if !ok {
		panic(fmt.Errorf("error in initializing value"))
	}

	txOpts.Value = value
	tx, err := c.tokenService.Transfer0(txOpts, "aleo1v7nr80exf6p2709py6xf692v9f69l5cm230w23tz2p9fhx954qpq7cm7p4")
	if err != nil {
		return err
	}

	receipt, err := c.getTxReceipt(ctx, tx.Hash())
	if err != nil {
		return err
	}
	if receipt.Status != 1 {
		return fmt.Errorf("error in transaction")
	}

	return nil
}

func (c *Client) MintUSDC(ctx context.Context, address ethCommon.Address, value *big.Int, chainId string) error {
	txOpts, err := c.buildTransactionOpts(ctx, chainId)
	if err != nil {
		return err
	}

	tx, err := c.usdc.Mint(txOpts, address, value)
	if err != nil {
		return err
	}

	receipt, err := c.getTxReceipt(ctx, tx.Hash())
	if err != nil {
		return err
	}
	if receipt.Status != 1 {
		return fmt.Errorf("error in transaction")
	}
	return nil
}

func (c *Client) ApproveUSDC(ctx context.Context, value *big.Int, chainId string) error {
	txOpts, err := c.buildTransactionOpts(ctx, chainId)
	if err != nil {
		return err
	}
	tx, err := c.usdc.Approve(txOpts, c.tokenServiceAddress, value)
	if err != nil {
		return err
	}
	receipt, err := c.getTxReceipt(ctx, tx.Hash())
	if err != nil {
		return err
	}
	if receipt.Status != 1 {
		return fmt.Errorf("error in transaction")
	}
	return nil

}

func (c *Client) TransferUSDC(ctx context.Context, value *big.Int, receiver string, chainId string) error {
	txOpts, err := c.buildTransactionOpts(ctx, chainId)
	if err != nil {
		return err
	}

	tx, err := c.tokenService.Transfer(txOpts, c.usdcAddress, value, receiver)
	if err != nil {
		return err
	}
	receipt, err := c.getTxReceipt(ctx, tx.Hash())
	if err != nil {
		return err
	}
	if receipt.Status != 1 {
		return fmt.Errorf("error in transaction")
	}
	return nil
}

func (c *Client) getTxReceipt(ctx context.Context, txHash ethCommon.Hash) (*types.Receipt, error) {
	for i := 0; i < 10; i++ {
		receipt, err := c.ethClient.TransactionReceipt(ctx, txHash)
		if err != nil {
			time.Sleep(time.Second * 20)
			continue
		}
		return receipt, err
	}
	return nil, fmt.Errorf("could not fetch the tx receipt of %s", txHash.String())
}

func loadWallet(path string) *ecdsa.PrivateKey {
	file, err := os.ReadFile(path)
	if err != nil {
		panic(err)
	}

	wallet, err := keystore.DecryptKey(file, "Icon@123")
	if err != nil {
		panic(err)
	}
	return wallet.PrivateKey
}

func (c *Client) GetLatestSequenceNumber(ctx context.Context) (uint64, error) {
	sequence, err := c.bridge.Sequence(&bind.CallOpts{
		Context: ctx,
	})
	if err != nil {
		return 0, err
	}
	return sequence.Uint64(), nil
}

/*
	transfer 10 eth into the token service
	that will generate a message in the bridge contract
	fetches the message in the bridge contract
	sends to the database
	check in the database?
*/
