package store

import (
	"encoding/binary"
	"encoding/json"
	"sync"

	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/logger"
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
	pkt = new(chain.Packet)
	err = json.Unmarshal(a[1], pkt)
	return
}

func RetrieveAndDeleteNPackets(namespace string, n int) ([]*chain.Packet, error) {
	s, err := retrieveAndDeleteNKeysFromFirst(namespace, n)
	if err != nil {
		return nil, err
	}
	pkts := make([]*chain.Packet, 0, len(s))
	for _, b := range s {
		pkt := new(chain.Packet)
		if err := json.Unmarshal(b, pkt); err != nil {
			return nil, err
		}
		pkts = append(pkts, pkt)
	}
	return pkts, nil
}

func RemoveKey[T keyConstraint](namespace string, key T, batch bool) error {
	k := getKeyByteForKeyConstraint(key)
	if batch {
		return batchDelete(namespace, k)
	}
	return delete(namespace, k)
}

func GetStartingSeqNumAndHeight(namespace string) (seqNum, height uint64) {
	seqNumB, heightB := getLastKeyValue(namespace)
	if len(seqNumB) != 0 {
		seqNum = convertType(uint64(0), seqNumB) + 1
	}
	if len(heightB) != 0 {
		height = convertType(uint64(0), heightB) + 1
	}
	return
}

func GetFirstKey[T keyConstraint](namespace string, keyType T) T {
	key := getFirstKey(namespace)
	if key == nil {
		return keyType
	}
	return convertType(keyType, key)
}

func ExistInGivenNamespace[T keyConstraint](namespace string, key T) bool {
	k := getKeyByteForKeyConstraint(key)
	return exitsInGivenBucket(namespace, k)
}

// PruneBaseSeqNum basically works as follow.
// When signature is successfully delivered to collector service then this packet's sequence number and height
// is stored in the given namespace.
// For example, if attestor successfully delivered signatures for packets with sequence number, 1,2,3,4,5,6,10,11,12,
// the this function will delete 1,2,3,4,5 and return's the sequence and height range and sets shouldFetch to true.
func PruneBaseSeqNum(namespace string) (a [2][2]uint64, shouldFetch bool) { // [[startSeqNum, EndSeqNum], [startHeight, endHeight]]
	seqNumCh := retrieveNKeyValuesFromFirst(namespace, 1000)
	kv, open := <-seqNumCh
	if !open && len(kv[0]) == 0 {
		return
	}

	curKey, curHeight := kv[0], kv[1]
	curBaseSeqNum := binary.BigEndian.Uint64(curKey)
	curBaseHeight := uint64(0)
	if len(curHeight) != 0 {
		curBaseHeight = binary.BigEndian.Uint64(curHeight)
	}
	var toDeleteKeys [][]byte
	for kv := range seqNumCh {
		nextSeqNum := binary.BigEndian.Uint64(kv[0])
		nextHeight := uint64(0)
		if len(kv[1]) != 0 {
			nextHeight = binary.BigEndian.Uint64(kv[1])
		}
		if nextSeqNum == curBaseSeqNum+1 {
			curBaseSeqNum = nextSeqNum
			curBaseHeight = nextHeight
			toDeleteKeys = append(toDeleteKeys, curKey)
			curKey = kv[0]
		} else {
			a[0] = [2]uint64{curBaseSeqNum, nextSeqNum}
			a[1] = [2]uint64{curBaseHeight, nextHeight}
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
				logger.GetLogger().Error("Error while batch deleting", zap.Error(err))
			}
		}(key)
	}
	wg.Wait()

	return
}

var screenValueMap = map[bool]string{true: "1", false: "0"}

func StoreWhiteStatus(ns, key string, value bool) error {
	return put(ns, []byte(key), []byte(screenValueMap[value]))
}

func GetAndDeleteWhiteStatus(ns, key string) (bool, error) {
	v, err := getAndDelete(ns, []byte(key))
	if err != nil {
		return false, err
	}
	return screenValueMap[true] == string(v), nil
}
