package aleo

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTransferEther(t *testing.T) {
	err := TransferUSDC(context.Background())
	assert.NoError(t, err)
}
