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
	defaultSendTxTimeout = 30 * time.Second
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

func (c *Client) buildTransactionOpts(ctx context.Context) (*bind.TransactOpts, error) {
	newTransactOpts := func() (*bind.TransactOpts, error) {
		txo, err := bind.NewKeyedTransactorWithChainID(c.privateKey, big.NewInt(11155111))
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

	txOpts.GasPrice = big.NewInt(defaultGasPrice)
	return txOpts, nil
}

func (c *Client) TransferEther(ctx context.Context) error {
	txOpts, err := c.buildTransactionOpts(ctx)
	if err != nil {
		return err
	}

	value := new(big.Int)
	value, ok := value.SetString("500000000000000000", 10)
	if !ok {
		panic(fmt.Errorf("error in initializing value"))
	}

	txOpts.Value = value
	tx, err := c.tokenService.Transfer0(txOpts, "aleo1n0e4f57rlgg7sl2f0sm0xha2557hc8ecw4zst93768qeggdzxgrqcs0vc6")
	if err != nil {
		return err
	}
	fmt.Println("tx hash is ", tx.Hash())
	receipt, err := c.getTxReceipt(ctx, tx.Hash())
	if err != nil {
		return err
	}
	fmt.Println(receipt.Status)

	return nil
}

func (c *Client) MintUSDC(ctx context.Context, address ethCommon.Address, value *big.Int) error {
	txOpts, err := c.buildTransactionOpts(ctx)
	if err != nil {
		return err
	}

	tx, err := c.usdc.Mint(txOpts, address, value)
	if err != nil {
		return err
	}
	fmt.Println("tx hash is ", tx.Hash())
	receipt, err := c.getTxReceipt(ctx, tx.Hash())
	if err != nil {
		return err
	}
	fmt.Println(receipt.Status)
	return nil
}

func (c *Client) ApproveUSDC(ctx context.Context, value *big.Int) error {
	txOpts, err := c.buildTransactionOpts(ctx)
	if err != nil {
		return err
	}
	tx, err := c.usdc.Approve(txOpts, c.tokenServiceAddress, value)
	if err != nil {
		return err
	}

	fmt.Println("tx hash is ", tx.Hash())
	receipt, err := c.getTxReceipt(ctx, tx.Hash())
	if err != nil {
		return err
	}
	fmt.Println(receipt.Status)
	return nil

}

func (c *Client) TransferUSDC(ctx context.Context, value *big.Int, receiver string) error {
	txOpts, err := c.buildTransactionOpts(ctx)
	if err != nil {
		return err
	}

	tx, err := c.tokenService.Transfer(txOpts, c.usdcAddress, value, receiver)
	if err != nil {
		return err
	}
	fmt.Println("tx hash is ", tx.Hash())
	receipt, err := c.getTxReceipt(ctx, tx.Hash())
	if err != nil {
		return err
	}
	fmt.Println(receipt.Status)
	return nil
}

func (c *Client) getTxReceipt(ctx context.Context, txHash ethCommon.Hash) (*types.Receipt, error) {
	for i := 0; i < 10; i++ {
		receipt, err := c.ethClient.TransactionReceipt(ctx, txHash)
		if err != nil {
			time.Sleep(time.Second * 5)
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

	wallet, err := keystore.DecryptKey(file, "hello")
	if err != nil {
		panic(err)
	}
	return wallet.PrivateKey
}

/*
	transfer 10 eth into the token service
	that will generate a message in the bridge contract
	fetches the message in the bridge contract
	sends to the database
	check in the database?
*/
