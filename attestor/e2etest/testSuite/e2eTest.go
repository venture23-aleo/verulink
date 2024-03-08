package testsuite

import (
	"context"
	"fmt"
	"math/big"
	"strconv"
	"testing"
	"time"

	ethCommon "github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/attestor/e2etest/chains/ethereum"
	"github.com/venture23-aleo/attestor/e2etest/common"
	dbservice "github.com/venture23-aleo/attestor/e2etest/dbService"
)

const (
	TokenReceiverAddress = "aleo1n0e4f57rlgg7sl2f0sm0xha2557hc8ecw4zst93768qeggdzxgrqcs0vc6"
	FinalityHeight       = 1
	EthChainID           = "28556963657430695"
	AleoChainID          = "6694886634403"
)

type E2ETest struct {
	t *testing.T
}

func NewE2ETest() *E2ETest {
	return &E2ETest{
		t: new(testing.T),
	}
}

func (e *E2ETest) ExecuteETHFlow(ctx context.Context, cfg *common.ChainConfig, dbServiceURI string) {
	ethClient := ethereum.NewClient(cfg)

	// store latest sequence number
	seqNumber, err := ethClient.GetLatestSequenceNumber(ctx)
	assert.NoError(e.t, err)

	// mint USDC
	value := new(big.Int)
	value, ok := value.SetString("100000000000000000000", 10)
	assert.True(e.t, ok)

	err = ethClient.MintUSDC(ctx, ethCommon.HexToAddress(cfg.WalletAddress), value)
	assert.NoError(e.t, err)

	// approve USDC to token Service
	transferValue := value.Div(value, big.NewInt(10)) // 10 percent of the total balance is approved
	err = ethClient.ApproveUSDC(ctx, transferValue)
	assert.NoError(e.t, err)

	// cross chain transfer of USDC
	err = ethClient.TransferUSDC(ctx, transferValue, TokenReceiverAddress)
	assert.NoError(e.t, err)

	fmt.Println("⌛ wait for relay to pick the txn in ethereum and post to db service")
	// wait for an appropriate amount of time for the packet to be picked up by the relayer and be sent to the db service
	averageBlockProducingTime := time.Second * 14
	waitTime := averageBlockProducingTime * (FinalityHeight + 2) // 2 as a buffer to ensure the packet arrives in the db service

	time.Sleep(waitTime)

	// query the db

	dbService := dbservice.NewDataBase(dbServiceURI)

	pktInfo, err := dbService.GetPacketInfo(ctx, strconv.Itoa(int(seqNumber)+1), EthChainID, AleoChainID)
	assert.NoError(e.t, err)
	assert.Equal(e.t, seqNumber+uint64(1), pktInfo.Sequence)

	fmt.Println("✅ Eth flow test passed")
}

func (e *E2ETest) ExecuteALEOFlow(ctx context.Context, cfg *common.ChainConfig, dbServiceURI string) {
	// right now only checking if the existing packets are sent to the db service
	// sequence number to be sent is 17 for this tesign purpose
	fmt.Println("⌛ wait for relay to pick the txn in ethereum and post to db service")
	averageBlockProducingTime := time.Second * 14
	waitTime := averageBlockProducingTime * (FinalityHeight + 2) // 2 as a buffer to ensure the packet arrives in the db service

	time.Sleep(waitTime)

	// query the db

	dbService := dbservice.NewDataBase(dbServiceURI)

	pktInfo, err := dbService.GetPacketInfo(ctx, strconv.Itoa(17), AleoChainID, EthChainID)
	assert.NoError(e.t, err)
	assert.Equal(e.t, uint64(17), pktInfo.Sequence)
	fmt.Println("✅ ALEO flow test passed")
}
