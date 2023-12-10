package store

import (
	"encoding/binary"
	"encoding/json"
	"time"

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

// StoreRetryPacket for storing transaction failed packetes with current timestamp as its key.
// i.e. Attestor sends transaction with packet as data in the field
// and transaction fails.
// namespace will collect packets that are destined to same bridge.
func StoreRetryPacket(namespace string, pkt *chain.Packet) error {
	// Make sure each key in a bucket are unique.
	// It also means that there should be single sender between src-destination configuration
	time.Sleep(time.Nanosecond)
	ts := time.Now().Nanosecond()
	key := make([]byte, 8)
	binary.BigEndian.PutUint64(key, uint64(ts))
	value, err := json.Marshal(pkt)
	if err != nil {
		return err
	}
	return put(namespace, key, value)
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
	// Make sure each key in a bucket are unique.
	// It also means that there should be single sender between src-destination configuration
	time.Sleep(time.Nanosecond)
	ts := time.Now().UnixNano()
	data, err := json.Marshal(txnPkt)
	if err != nil {
		return err
	}

	key := make([]byte, 8)
	binary.NativeEndian.PutUint64(key, uint64(ts))
	return put(namespace, key, data)
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
			txnPkt.TSByte = key
			ch <- txnPkt
		}
		close(ch)
	}()
	return ch
}
