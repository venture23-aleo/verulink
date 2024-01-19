package store

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/venture23-aleo/attestor/chainService/chain"
	"go.uber.org/zap"
)

func InitKVStore(path string) error {
	return initDB(path)
}

func CloseDB() error {
	err := closeDB()
	if err != nil {
		return err
	}
	return nil
}

func CreateNamespaces(names []string) error {
	for _, name := range names {
		if err := CreateNamespace(name); err != nil {
			return err
		}
	}
	return nil
}

func CreateNamespace(ns string) error {
	return createBucket(ns)
}

/*****************************************************************************************************/

func RemoveKey[T keyConstraint](namespace string, key T, batch bool) error {
	k := getKeyByteForKeyConstraint(key)
	if batch {
		return batchDelete(namespace, k)
	}
	return delete(namespace, k)
}

func GetFirstKey[T keyConstraint](namespace string, keyType T) T {
	key := getFirstKey(namespace)
	if key == nil {
		return keyType
	}
	return convertKey(keyType, key)
}

func GetPacket[T keyConstraint](namespace string, key T, logger *zap.Logger) *chain.Packet {
	k := getKeyByteForKeyConstraint(key)
	v := get(namespace, k)
	if v == nil {
		return nil
	}
	pkt := new(chain.Packet)
	if err := json.Unmarshal(v, pkt); err != nil {
		if logger != nil {
			logger.Error(err.Error())
		}
		return nil
	}
	return pkt
}

func ExistInGivenNamespace[T keyConstraint](namespace string, key T) bool {
	k := getKeyByteForKeyConstraint(key)
	return exitsInGivenBucket(namespace, k)
}

// RetrieveNPackets retrieves n packets from first index
func RetrieveNPackets(namespace string, n int) chan *chain.Packet {
	pktCh := retrieveNKeyValuesFromFirst(namespace, n)
	ch := make(chan *chain.Packet)
	go func() {
		for kv := range pktCh {
			value := kv[1]
			pkt := new(chain.Packet)
			json.Unmarshal(value, pkt)
			ch <- pkt
		}
		close(ch)
	}()
	return ch
}

func StartStoringPackets(ctx context.Context, ch <-chan *chain.Packet) {
	for {
		var pkt *chain.Packet
		select {
		case <-ctx.Done():
			return
		case pkt = <-ch:
		}

		// store all packets under same namespace
		_ = pkt
	}
}

var screenValueMap = map[bool]string{true: "1", false: "0"}

func StoreScreenValue(ns, key string, value bool) error {
	return put(ns, []byte(key), []byte(screenValueMap[value]))
}

func GetScreenValue(ns, key string) (bool, error) {
	v := get(ns, []byte(key))
	if len(v) == 0 {
		return false, errors.New("key does not exist")
	}
	return screenValueMap[true] == string(v), nil
}
