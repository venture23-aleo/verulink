package store

import (
	"encoding/binary"
	"encoding/json"
	"sync"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

func InitKVStore(path string) {
	initDB(path)
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

func StoreBaseSeqNum(namespace string, seqNum uint64) error {
	key := make([]byte, 8)
	binary.BigEndian.PutUint64(key, seqNum)
	return batchPut(namespace, key, nil)
}

func RemoveTxnKeyAndStoreBaseSeqNum(
	txnNamespace string, txnKeys [][]byte,
	seqNumNamespace string, seqNums []uint64,
) {
	for _, txnKey := range txnKeys {
		go func(txnKey []byte) {
			if err := batchDelete(txnNamespace, txnKey); err != nil {
				// log error
			}
		}(txnKey)
	}

	for _, seqNum := range seqNums {
		go func(seqNum uint64) {
			key := make([]byte, 8)
			binary.BigEndian.PutUint64(key, seqNum)
			if err := batchPut(seqNumNamespace, key, nil); err != nil {
				// log error
			}
		}(seqNum)
	}
}

func PruneBaseSeqNum(namespace string) uint64 {
	// todo: 1000 can be later on considered to be average number of packets in given time interval
	// Also take care about the number of go-routines it is going to create below.

	ch := retrieveNKeyValuesFromFirst(namespace, 1000)
	v, closed := <-ch
	if closed {
		return 0
	}
	key := v[0]
	curBaseSeqNum := binary.BigEndian.Uint64(key)
	var toDeleteKeys [][]byte

	for v := range ch {
		key := v[0]
		nextSeqNum := binary.BigEndian.Uint64(key)
		if nextSeqNum == curBaseSeqNum+1 {
			curBaseSeqNum = nextSeqNum
			toDeleteKeys = append(toDeleteKeys, key)
		} else {
			break
		}
	}

	wg := sync.WaitGroup{}
	wg.Add(len(toDeleteKeys))
	for _, key := range toDeleteKeys {
		go func(key []byte) {
			if err := batchDelete(namespace, key); err != nil {
				// log error
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

func IsLocallyStored[T keyConstraint](namespaces []string, key T) bool {
	k := getKeyByteForKeyConstraint(key)
	return exitsInGivenBuckets(namespaces, k)
}

func RetrieveNRetryPackets(namespace string, n int) chan *chain.Packet {
	pktCh := retrieveNKeyValuesFromFirst(namespace, n)
	ch := make(chan *chain.Packet)
	go func() {
		for kv := range pktCh {
			key := kv[0]
			value := kv[1]
			pkt := new(chain.Packet)
			pkt.TSByte = key
			json.Unmarshal(value, pkt)
			ch <- pkt
		}
		close(ch)
	}()
	return ch
}

func StoreTransactedPacket(namespace string, txnPkt *chain.TxnPacket) error {
	data, err := json.Marshal(txnPkt)
	if err != nil {
		return err
	}

	key := make([]byte, 8)
	binary.NativeEndian.PutUint64(key, txnPkt.Pkt.Sequence)
	return batchPut(namespace, key, data)
}

func RetrieveNPackets(namespace string, n int) chan *chain.TxnPacket {
	pktCh := retrieveNKeyValuesFromFirst(namespace, n)
	ch := make(chan *chain.TxnPacket)
	go func() {
		for kv := range pktCh {
			key := kv[0]
			value := kv[1]
			txnPkt := new(chain.TxnPacket)
			json.Unmarshal(value, txnPkt)
			txnPkt.SeqByte = key
			ch <- txnPkt
		}
		close(ch)
	}()
	return ch
}
