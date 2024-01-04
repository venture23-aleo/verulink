package store

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"os"
	"reflect"
	"strconv"
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

func setTestDB() (func(), error) {

	p := "./bolt.db"
	err := initDB(p)
	if err != nil {
		return nil, err
	}

	return func() {
		os.RemoveAll(p)
	}, nil
}

func getKeyInByte(k interface{}) ([]byte, error) {
	switch key := k.(type) {
	case int:
		b := make([]byte, 8)
		binary.BigEndian.PutUint64(b, uint64(key))
		return b, nil
	case int64:
		b := make([]byte, 8)
		binary.BigEndian.PutUint64(b, uint64(key))
		return b, nil
	case uint:
		b := make([]byte, 8)
		binary.BigEndian.PutUint64(b, uint64(key))
		return b, nil
	case uint64:
		b := make([]byte, 8)
		binary.BigEndian.PutUint64(b, key)
		return b, nil
	case string:
		return []byte(key), nil
	case []byte:
		return key, nil
	}
	return nil, fmt.Errorf("invalid type %T", k)
}

func setupDB(nameSpace string, data map[interface{}]interface{}) error {
	if err := CreateNamespace(nameSpace); err != nil {
		return err
	}
	for key, value := range data {
		k, err := getKeyInByte(key)
		if err != nil {
			return err
		}
		v, err := json.Marshal(value)
		if err != nil {
			return err
		}
		if err := put(nameSpace, k, v); err != nil {
			return err
		}
	}
	return nil
}

func TestStoreRetryPacket(t *testing.T) {
	dbRemover, err := setTestDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	totNum := 100
	packets := make(map[interface{}]interface{}, totNum)
	for i := 1; i <= totNum; i++ {
		var p interface{} = chain.Packet{
			Sequence: uint64(i),
			Height:   uint64(i),
		}
		packets[uint64(i)] = p
	}

	namespace := "retry_packets"
	err = setupDB(namespace, packets)
	require.NoError(t, err)
	t.Run("test_store_and_retrieve", func(t *testing.T) {
		for i := 1; i < totNum; i++ {
			key := make([]byte, 8)
			binary.BigEndian.PutUint64(key, uint64(i))
			value := get(namespace, key)
			p := chain.Packet{}
			err = json.Unmarshal(value, &p)
			require.NoError(t, err)
			t.Logf("packet: %+v", p)
			t.Logf("packet in map: %+v", packets[uint64(i)])
			isDeepEqual := reflect.DeepEqual(p, packets[uint64(i)])
			require.True(t, isDeepEqual, "packet: ", p)
		}
	})

	t.Run("retrieve_n_key_values_from_first", func(t *testing.T) {
		ch := retrieveNKeyValuesFromFirst(namespace, 100)
		arr, ok := <-ch
		require.True(t, ok)
		require.NotNil(t, arr)
		prevKey := arr[0]
		for arr := range ch {
			require.Equal(t, 1, bytes.Compare(arr[0], prevKey))
			prevKey = arr[0]
		}
	})
}

func TestRemoveTxnKeyAndStoreBaseSeqNum(t *testing.T) {
	dbRemover, err := setTestDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	totNum := 10
	data := make(map[interface{}]interface{}, totNum)
	for i := 0; i < totNum; i++ {
		data[uint64(i)] = chain.Packet{
			Sequence: uint64(i),
		}
	}

	txnNamespace := "TestRemoveTxnKeyAndStoreBaseSeqNum"
	err = setupDB(txnNamespace, data)
	require.NoError(t, err)
	seqNumNamespace := "SeqNumNamespace"
	err = setupDB(seqNumNamespace, nil)
	require.NoError(t, err)

	seqNums := []uint64{5, 7, 9}
	txnKeys := make([][]byte, len(seqNums))
	for i, seq := range seqNums {
		k := make([]byte, 8)
		binary.BigEndian.PutUint64(k, seq)
		txnKeys[i] = k
		fmt.Printf("Transformed Key: %d, byte: %v\n", seq, k)

	}

	t.Log("txnkeys: ", txnKeys)
	RemoveTxnKeyAndStoreBaseSeqNum(txnNamespace, txnKeys, seqNumNamespace, seqNums, nil)

	for _, seq := range seqNums {
		key := make([]byte, 8)
		binary.BigEndian.PutUint64(key, seq)
		value := get(txnNamespace, key)
		require.Nil(t, value)
		value = get(seqNumNamespace, key)
		require.NotNil(t, value)
	}
}

func TestPruneBaseSeqNum(t *testing.T) {
	dbRemover, err := setTestDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	namespace := "baseSeqNumNamespace"
	totSeqNums := uint64(1000)
	data := make(map[interface{}]interface{}, totSeqNums)
	skipSeqNum := uint64(501)
	for i := uint64(0); i < totSeqNums; i++ {
		if i == skipSeqNum {
			continue
		}
		data[i] = nil
	}

	err = setupDB(namespace, data)
	require.NoError(t, err)
	curBaseSeqNum := PruneBaseSeqNum(namespace, nil)
	require.Equal(t, skipSeqNum-1, curBaseSeqNum)

	for i := uint64(0); i < skipSeqNum; i++ {
		key := make([]byte, 8)
		binary.BigEndian.PutUint64(key, i)
		value := get(namespace, key)
		require.Nil(t, value, "key: ", i)
	}

	for i := skipSeqNum + 1; i < totSeqNums; i++ {
		key := make([]byte, 8)
		binary.BigEndian.PutUint64(key, i)
		value := get(namespace, key)
		require.NotNil(t, value)
	}
}

func TestRemoveKey(t *testing.T) {
	dbRemover, err := setTestDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	namespace := "removeKeyTestNamespace"
	data := map[interface{}]interface{}{
		"key1": "value1",
		"key2": "value2",
		"key3": "value3",
	}

	err = setupDB(namespace, data)
	require.NoError(t, err)

	RemoveKey[string](namespace, "key1", false)

	value := get(namespace, []byte("key1"))
	require.Nil(t, value)
	value = get(namespace, []byte("key2"))
	require.NotNil(t, value)
}

func TestGetFirstKey(t *testing.T) {
	dbRemover, err := setTestDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	namespace := "testGetFirstKeyNamespace"
	var keys [][]byte
	data := make(map[interface{}]interface{})

	for i := 100; i > 0; i-- {
		key := make([]byte, 8)
		binary.BigEndian.PutUint64(key, uint64(i))
		keys = append(keys, key)
		data[i] = nil
	}

	for i := 1; i < 100; i++ {
		s := strconv.Itoa(i)
		key := []byte(s)
		keys = append(keys, key)
		data[s] = nil
	}

	err = setupDB(namespace, data)
	require.NoError(t, err)

	minOrderedKey := keys[0]
	for _, key := range keys {
		if bytes.Compare(minOrderedKey, key) == 1 {
			minOrderedKey = key
		}
	}

	t.Logf("Min key: %s, Type: %T", minOrderedKey, minOrderedKey)
	key := GetFirstKey[[]byte](namespace, []byte{})
	require.Equal(t, minOrderedKey, key)

	namespace = "emptyNamespace"
	err = setupDB(namespace, nil)
	require.NoError(t, err)

	k := GetFirstKey(namespace, "")
	require.Empty(t, k)
}

func TestRetrieveNPackets(t *testing.T) {
	dbRemover, err := setTestDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	data := map[interface{}]interface{}{}
	for i := 0; i < 100; i++ {
		data[i] = i
	}
	namespace := "testRetrieveNPackets"
	err = setupDB(namespace, data)
	require.NoError(t, err)

	t.Run("test_for_n_lesser_than_100", func(t *testing.T) {
		ch := RetrieveNPackets(namespace, 10)
		count := 0
		for range ch {
			count++
		}
		require.Equal(t, 10, count)
	})

	t.Run("test_for_n_greater_than_100", func(t *testing.T) {
		ch := RetrieveNPackets(namespace, 1000)
		count := 0
		for range ch {
			count++
		}
		require.Equal(t, 100, count)
	})
}

func TestExistInGivenNamespace(t *testing.T) {
	dbRemover, err := setTestDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)
	namespace := "testExistInGivenNamespace"
	data := map[interface{}]interface{}{
		"key1": "value1",
	}
	err = setupDB(namespace, data)
	require.NoError(t, err)

	isExist := ExistInGivenNamespace(namespace, "key1")
	require.True(t, isExist)
	isExist = ExistInGivenNamespace(namespace, "nonExistingKey")
	require.False(t, isExist)
}
