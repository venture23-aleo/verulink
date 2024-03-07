package testsuite

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"testing"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/venture23-aleo/attestor/e2etest/chains/ethereum"
	"github.com/venture23-aleo/attestor/e2etest/common"
)

const (
	TokenReceiverAddress = "aleo1n0e4f57rlgg7sl2f0sm0xha2557hc8ecw4zst93768qeggdzxgrqcs0vc6"
)

type E2ETest struct {
	T *testing.T
}

func NewE2ETest() *E2ETest {
	return &E2ETest{
		T: new(testing.T),
	}
}

func (e *E2ETest) ExecuteETHFlow(ctx context.Context, cfg *common.ChainConfig) (bool, error) {
	// transfer some usdc
	// wait for an appropriate amount of time to wait for the relayer to pick the message and put it in dbservice
	// query db service if the packet has arrived

	ethClient := ethereum.NewClient(cfg)

	// mint USDC
	value := new(big.Int)
	value, ok := value.SetString("100000000000000000000", 10)
	if !ok {
		return false, errors.New("error in initializing value")
	}
	err := ethClient.MintUSDC(ctx, ethCommon.HexToAddress(cfg.WalletAddress), value)
	if err != nil {
		fmt.Println(err)
		return false, err
	}

	// approve USDC to token Service
	transferValue := value.Div(value, big.NewInt(10)) // 10 percent of the total balance is approved
	err = ethClient.ApproveUSDC(ctx, transferValue)
	if err != nil {
		fmt.Println(err)
		return false, err
	}

	// cross chain transfer of USDC
	err = ethClient.TransferUSDC(ctx, transferValue, TokenReceiverAddress)
	if err != nil {
		fmt.Println(err)
		return false, err
	}

	// wait for an appropriate amount of time for the packet to be picked up by the relayer and be sent to the db service 
	
	// check the entries in the db service 
	return true, err
}
