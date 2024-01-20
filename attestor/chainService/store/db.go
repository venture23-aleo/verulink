package store

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"errors"
	"sync"

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

func StoreBaseSeqNum(namespace string, k, v uint64) error {
	key := getKeyByteForKeyConstraint(k)
	var value []byte
	if v != 0 { // ethereum will send height as value while aleo does not require to send height
		value = getKeyByteForKeyConstraint(v)
	}
	return put(namespace, key, value)
}

func StoreRetryPacket(namespace string, pkt *chain.Packet) error {
	key := getKeyByteForKeyConstraint(pkt.Sequence)
	value, err := json.Marshal(pkt)
	if err != nil {
		return err
	}
	return put(namespace, key, value)
}

func RetrieveAndDeleteFirstPacket(namespace string) (pkt *chain.Packet, err error) {
	a, err := retrieveAndDeleteFirstKey(namespace)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(a[1], pkt)
	return
}

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

func RetrieveNPacketsFromPrefix(namespace string, n int, prefix string) chan *chain.Packet {
	pktCh := retrieveNKeyValuesAfterPrefix(namespace, n, prefix)
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

// RetrieveNPackets retrieves n packets from first index
// Caller should process sequence number range as semi-open end and height range as close end.
func PruneBaseSeqNum(namespace string) (a [2][2]uint64, shouldFetch bool) { // [[startSeqNum, EndSeqNum], [startHeight, endHeight]]
	seqNumCh := retrieveNKeyValuesFromFirst(namespace, 1000)
	kv, open := <-seqNumCh
	if !open && len(kv[0]) == 0 {
		return
	}

	curKey, curHeight := kv[0], kv[1]
	curBaseSeqNum := binary.BigEndian.Uint64(curKey)
	curBaseHeight := binary.BigEndian.Uint64(curHeight)
	var toDeleteKeys [][]byte
	for kv := range seqNumCh {
		key := kv[0]
		nextSeqNum := binary.BigEndian.Uint64(key)
		if nextSeqNum == curBaseSeqNum+1 {
			curBaseSeqNum = nextSeqNum
			toDeleteKeys = append(toDeleteKeys, curKey)
			curKey = key
		} else {
			startSeqNum := curBaseSeqNum
			startHeight := curBaseHeight
			endSeqNum := binary.BigEndian.Uint64(key)
			endHeight := binary.BigEndian.Uint64(kv[1])

			a[0] = [2]uint64{startSeqNum, endSeqNum}
			a[1] = [2]uint64{startHeight, endHeight}
			shouldFetch = true
			break
		}
	}

	wg := sync.WaitGroup{}
	wg.Add(len(toDeleteKeys))
	for _, key := range toDeleteKeys {
		go func(key []byte) {
			defer wg.Done()
			if err := batchDelete(namespace, key); err != nil {
				// log error
			}
		}(key)
	}
	wg.Wait()

	return
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
