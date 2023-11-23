package store

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

func TestDatabase(t *testing.T) {
	InitKVStore("database")
	key := "111"
	value := &chain.QueuedMessage{
		RetryCount: 50,
	}
	err := StoreRetryPacket("aleo", key, value)
	assert.Nil(t, err)

	dbVal, err := GetRetryPacket("aleo", key)
	assert.Nil(t, err)
	assert.Equal(t, 50, dbVal.RetryCount)
}

func TestDatabaseDelete(t *testing.T) {
	InitKVStore("database")
	key := "111"
	err := DeleteRetryPacket("aleo", key)
	assert.Nil(t, err)

	value, err := GetRetryPacket("aleo", key)
	assert.NotNil(t, err)
	assert.Nil(t, value)
}
