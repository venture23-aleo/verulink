package store

import (
	"errors"

	"go.etcd.io/bbolt"
)

var db *bbolt.DB

func initDB(path string) error {
	var err error
	db, err = bbolt.Open(path, 0o655, nil)
	if err != nil {
		return err
	}
	return nil
}

func closeDB() error {
	return db.Close()
}

func createBucket(ns string) error {
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

func get(bucket string, key []byte) (value []byte) {
	db.View(func(tx *bbolt.Tx) error { // nolint
		bkt := tx.Bucket([]byte(bucket))
		data := bkt.Get(key)
		if data == nil {
			return nil
		}
		value = make([]byte, len(data))
		copy(value, data)
		return nil
	})

	return
}

// getAndDelete returns value of key if it exists in the bucket otherwise
// returns error.
func getAndDelete(bucket string, key []byte) (value []byte, err error) {
	err = db.Update(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		data := bkt.Get(key)
		if data == nil {
			return errors.New("key does not exist")
		}
		value = make([]byte, len(data))
		copy(value, data)
		return bkt.Delete(key)
	})
	if err != nil {
		return nil, err
	}
	return
}

func getFirstKey(bucket string) []byte {
	var key []byte
	db.View(func(tx *bbolt.Tx) error { // nolint
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

func getLastKeyValue(bucket string) (key, value []byte) {
	db.View(func(tx *bbolt.Tx) error { // nolint
		bkt := tx.Bucket([]byte(bucket))
		if bkt == nil {
			return nil
		}
		c := bkt.Cursor()
		k, v := c.Last()
		if k == nil {
			return nil
		}

		key = make([]byte, len(k))
		copy(key, k)
		value = make([]byte, len(v))
		copy(value, v)
		return nil
	})
	return
}

func existsInGivenBucket(bktName string, key []byte) (exist bool) {
	db.View(func(tx *bbolt.Tx) error { // nolint
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

// retrieveNKeyValuesFromFirst will return channel and populate minimum of n and total keys number of packets
func retrieveNKeyValuesFromFirst(bucket string, n int) <-chan [2][]byte {
	ch := make(chan [2][]byte, n)
	go func() {
		count := 0
		db.View(func(tx *bbolt.Tx) error { // nolint
			bkt := tx.Bucket([]byte(bucket))
			if bkt == nil {
				// Nothing to read; return an empty channel without error
				close(ch)
				return nil
			}
			c := bkt.Cursor()
			for key, value := c.First(); count != n && key != nil; key, value = c.Next() {
				k := make([]byte, len(key))
				v := make([]byte, len(value))
				copy(k, key)
				copy(v, value)
				ch <- [2][]byte{k, v}
				count++
			}
			close(ch)
			return nil
		})
	}()
	return ch
}

// retrieveAndDeleteNKeysFromFirst returns up to n values starting from the first key
// and deletes those keys. If the bucket does not exist or is empty, it returns an
// empty slice and no error.
func retrieveAndDeleteNKeysFromFirst(bucket string, n int) (s [][]byte, err error) {
	s = make([][]byte, 0, n)
	err = db.Update(func(tx *bbolt.Tx) error {
		bkt := tx.Bucket([]byte(bucket))
		if bkt == nil {
			return nil
		}
		c := bkt.Cursor()
		for key, value := c.First(); key != nil && len(s) < n; key, value = c.Next() {
			v := make([]byte, len(value))
			copy(v, value)
			if err := bkt.Delete(key); err != nil {
				return err
			}
			s = append(s, v)
		}
		return nil
	})
	return
}

func namespaceExists(namespace string) bool {
	exists := false
	db.View(func(tx *bbolt.Tx) error { // nolint
		bkt := tx.Bucket([]byte(namespace))
		exists = bkt != nil
		return nil
	})
	return exists
}

func deleteBucket(ns string) error {
	return db.Update(func(tx *bbolt.Tx) error {
		return tx.DeleteBucket([]byte(ns))
	})
}
