package store

import (
	"fmt"
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

func TestGetDatabaseValue(t *testing.T) {
	InitKVStore("retrydb")
	key := "507884"
	value, err := GetRetryPacket("ethereum", key)
	fmt.Println(value.DepartureBlock)
	assert.Nil(t, err)
}

func TestGetALLDBValue(t *testing.T) {
	InitKVStore("retrydb")
	value, err := GetAllRetryPackets("ethereum")
	fmt.Println("value len is:", len(value))

	for _, v := range(value) {
		fmt.Println("depart block:", v.DepartureBlock)
	}
	assert.Nil(t, err)
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
