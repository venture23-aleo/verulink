package store

import (
	"encoding/binary"
	"encoding/json"
	"sync"

	"github.com/venture23-aleo/validator/chain"
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

func CreateNamespace(ns string) error {
	return createBucket(ns)
}

/*****************************************************************************************************/

// StoreRetryPacket for storing transaction failed packetes with sequence number as its key.
// i.e. Attestor sends transaction with packet as data in the field
// and transaction fails.
// namespace will collect packets that are destined to same bridge.
func StoreRetryPacket(namespace string, pkt *chain.Packet) error {
	key := make([]byte, 8)
	binary.BigEndian.PutUint64(key, pkt.Sequence)
	value, err := json.Marshal(pkt)
	if err != nil {
		return err
	}
	return put(namespace, key, value)
}

func RemoveTxnKeyAndStoreBaseSeqNum(
	txnNamespace string, txnKeys [][]byte,
	seqNumNamespace string, seqNums []uint64,
	logger *zap.Logger,
) {
	wg := sync.WaitGroup{}
	wg.Add(len(txnKeys))
	for _, txnKey := range txnKeys {
		go func(txnKey []byte) {
			defer wg.Done()
			if err := batchDelete(txnNamespace, txnKey); err != nil {
				if logger != nil {
					logger.Error(err.Error())
				}
			}
		}(txnKey)
	}

	wg.Add(len(seqNums))
	for _, seqNum := range seqNums {
		go func(seqNum uint64) {
			defer wg.Done()
			key := make([]byte, 8)
			binary.BigEndian.PutUint64(key, seqNum)
			if err := batchPut(seqNumNamespace, key, nil); err != nil {
				if logger != nil {
					logger.Error(err.Error())
				}
			}
		}(seqNum)
	}
	wg.Wait()
}

func PruneBaseSeqNum(namespace string, logger *zap.Logger) uint64 {
	// todo: 1000 can be later on considered to be average number of packets in given time interval
	// Also take care about the number of go-routines it is going to create below.

	ch := retrieveNKeyValuesFromFirst(namespace, 1000)
	v, open := <-ch
	if !open && len(v[0]) == 0 {
		return 0
	}
	curKey := v[0] // current key
	curBaseSeqNum := binary.BigEndian.Uint64(curKey)
	var toDeleteKeys [][]byte

	for v := range ch {
		key := v[0]
		nextSeqNum := binary.BigEndian.Uint64(key)
		if nextSeqNum == curBaseSeqNum+1 {
			curBaseSeqNum = nextSeqNum
			toDeleteKeys = append(toDeleteKeys, curKey)
			curKey = key
		} else {
			break
		}
	}

	wg := sync.WaitGroup{}
	wg.Add(len(toDeleteKeys))
	for _, key := range toDeleteKeys {
		go func(key []byte) {
			defer wg.Done()
			if err := batchDelete(namespace, key); err != nil {
				if logger != nil {
					logger.Error(err.Error())
				}
				// handling error is not necessary as delete can happen in next iteration.
			}
		}(key)
	}
	wg.Wait()

	return curBaseSeqNum
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

func StoreTransactedPacket(namespace string, pkt *chain.Packet) error {
	data, err := json.Marshal(pkt)
	if err != nil {
		return err
	}

	key := make([]byte, 8)
	binary.BigEndian.PutUint64(key, pkt.Sequence)
	return put(namespace, key, data)
}

// RetrieveNPackets retrieves n packets from first index
func RetrieveNPackets(namespace string, n int) chan *chain.Packet {
	pktCh := retrieveNKeyValuesFromFirst(namespace, n)
	ch := make(chan *chain.Packet)
	go func() {
		for kv := range pktCh {
			key := kv[0]
			value := kv[1]
			pkt := new(chain.Packet)
			json.Unmarshal(value, pkt)
			pkt.SeqByte = key
			ch <- pkt
		}
		close(ch)
	}()
	return ch
}
