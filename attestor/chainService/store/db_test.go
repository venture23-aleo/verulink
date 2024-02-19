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
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
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

func TestCreateNamespaces(t *testing.T) {
	dbRemover, err := setTestDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)

	namespace := "testCreateNamespaces"
	err = setupDB(namespace, nil)
	require.NoError(t, err)

	namespaces := []string{
		"ns1",
		"ns2",
		"ns3",
		"ns4",
	}
	err = CreateNamespaces(namespaces)
	require.NoError(t, err)

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

	RemoveKey[string](namespace, "key1", false) // nolint

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

func TestRetrieveAndDeleteFirstPacket(t *testing.T) {
	dbRemover, err := setTestDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)
	ns := "testExistInGivenNamespace"
	err = setupDB(ns, nil)
	require.NoError(t, err)

	pkts := []chain.Packet{
		{
			Sequence: 1,
			Height:   12,
		}, {
			Sequence: 2,
			Height:   13,
		},
	}

	for _, pkt := range pkts {
		err := StoreRetryPacket(ns, &pkt)
		require.NoError(t, err)
	}

	pkt, err := RetrieveAndDeleteFirstPacket(ns)
	require.NoError(t, err)
	require.Equal(t, *pkt, pkts[0])

	pkt, err = RetrieveAndDeleteFirstPacket(ns)
	require.NoError(t, err)
	require.Equal(t, *pkt, pkts[1])

	pkt, err = RetrieveAndDeleteFirstPacket(ns)
	require.Error(t, err)
}

func TestRetrieveAndDeleteNPackets(t *testing.T) {
	dbRemover, err := setTestDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)
	ns := "testRetrieveAndDeleteNPackets"
	err = setupDB(ns, nil)
	require.NoError(t, err)

	pkts := []*chain.Packet{}
	for i := 1; i <= 10; i++ {
		pkt := &chain.Packet{Sequence: uint64(i)}
		err := StoreRetryPacket(ns, pkt)
		require.NoError(t, err)
		pkts = append(pkts, pkt)
	}

	pkts, err = RetrieveAndDeleteNPackets(ns, 2)
	require.NoError(t, err)
	for i := 0; i < 2; i++ {
		require.EqualValues(t, i+1, pkts[i].Sequence)
	}

	pkts, err = RetrieveAndDeleteNPackets(ns, 10)
	require.NoError(t, err)
	require.Len(t, pkts, 8)
	for i := range pkts {
		require.EqualValues(t, i+3, pkts[i].Sequence)
	}
}

func TestPruneBaseSeqNum(t *testing.T) {
	dbRemover, err := setTestDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)
	ns := "testPruneBaseSeqNum"
	err = setupDB(ns, nil)
	require.NoError(t, err)

	_, shouldFetch := PruneBaseSeqNum(ns)
	require.False(t, shouldFetch)

	m := map[uint64]uint64{}
	for i := uint64(1); i < 20; i++ {
		m[i] = i + 10
	}

	skipSeqNum := uint64(10)
	for k, v := range m {
		if k == skipSeqNum {
			continue
		}
		err = StoreBaseSeqNum(ns, k, v)
		require.NoError(t, err)
	}

	for i := 0; i < 2; i++ {
		a, shouldFetch := PruneBaseSeqNum(ns)
		require.True(t, shouldFetch)
		require.Equal(t, skipSeqNum-1, a[0][0])
		require.Equal(t, skipSeqNum+1, a[0][1])
	}

	err = StoreBaseSeqNum(ns, skipSeqNum, m[skipSeqNum])
	require.NoError(t, err)
	_, shouldFetch = PruneBaseSeqNum(ns)
	require.False(t, shouldFetch)
}

func TestGetAndDeleteWhiteStatus(t *testing.T) {
	dbRemover, err := setTestDB()
	require.NoError(t, err)
	t.Cleanup(dbRemover)
	ns := "testGetAndDeleteWhiteStatus"
	err = setupDB(ns, nil)
	require.NoError(t, err)

	key1, key2 := "myPacket1", "myPacket2"
	err = StoreWhiteStatus(ns, key1, true)
	require.NoError(t, err)
	err = StoreWhiteStatus(ns, key2, false)
	require.NoError(t, err)

	isWhite, err := GetAndDeleteWhiteStatus(ns, key1)
	require.NoError(t, err)
	require.True(t, isWhite)

	isWhite, err = GetAndDeleteWhiteStatus(ns, key2)
	require.NoError(t, err)
	require.False(t, isWhite)

	isWhite, err = GetAndDeleteWhiteStatus(ns, key1)
	require.Error(t, err)
	require.False(t, isWhite)
}
