package store

import (
	"fmt"
	"sync"

	"go.etcd.io/bbolt"
)

var (
	db *bbolt.DB
	mu sync.RWMutex
)

func initDB(path string) error {
	fmt.Println("db initialized")
	var err error
	mu = sync.RWMutex{}
	db, err = bbolt.Open(path, 0655, nil)
	if err != nil {
		return err
	}
	fmt.Println("db from init db", db)
	return nil
}

func closeDB() error {
	err := db.Close()
	if err != nil {
		return err
	}
	return nil
}

func createBucket(ns string) error {
	fmt.Println("************* create bucket *************", db)
	return db.Update(func(tx *bbolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte(ns))
		return err
	})
}

func delete(bucket string, key []byte) error {
	return db.Update(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		return bkt.Delete(key)
	})
}

func batchDelete(bucket string, key []byte) error {
	return db.Batch(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		return bkt.Delete(key)
	})
}

func put(bucket string, key, value []byte) error {
	return db.Update(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		return bkt.Put(key, value)
	})
}

func batchPut(bucket string, key, value []byte) error {
	return db.Batch(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		return bkt.Put(key, value)
	})
}

func get(bucket string, key []byte) (value []byte) {
	db.View(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		data := bkt.Get(key)
		value = make([]byte, len(data))
		copy(value, data)
		return nil
	})

	return
}

func getFirstKey(bucket string) []byte {
	var key []byte
	db.View(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		if bkt == nil {
			return nil
		}
		c := bkt.Cursor()
		k, _ := c.First()
		if k == nil {
			return nil
		}

		key = make([]byte, len(k))
		copy(key, k)
		return nil
	})

	return key
}

func exitsInGivenBucket(bktName string, key []byte) (exist bool) {
	db.View(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bktName))
		if bkt == nil {
			return nil
		}

		value := bkt.Get(key)
		if value != nil {
			exist = true
		}
		return nil
	})
	return
}

func retrieveNKeyValuesAfterPrefix(bucket string, n int, prefix string) [][2][]byte {
	count := 0
	s := make([][2][]byte, 0)
	db.View(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		c := bkt.Cursor()
		for key, value := c.Seek([]byte(prefix)); count != n && key != nil; key, value = c.Next() {
			k := make([]byte, len(key))
			v := make([]byte, len(value))
			copy(k, key)
			copy(v, value)
			a := [2][]byte{k, v}
			s = append(s, a)
			count++
		}
		return nil
	})
	return s
}

// This function will return channel and populate minimum of n and total keys number of packets
func retrieveNKeyValuesFromFirst(bucket string, n int) <-chan [2][]byte {
	ch := make(chan [2][]byte, n)
	go func() {
		count := 0
		db.View(func(tx *bbolt.Tx) error {
			bkt := tx.Bucket([]byte(bucket))
			c := bkt.Cursor()
			for key, value := c.First(); count != n && key != nil; key, value = c.Next() {
				k := make([]byte, len(key))
				v := make([]byte, len(value))
				copy(k, key)
				copy(v, value)
				ch <- [2][]byte{k, v}
				count++
			}
			return nil
		})
		close(ch)
	}()

	return ch
}
