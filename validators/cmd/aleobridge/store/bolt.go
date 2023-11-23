package store

import (
	"sync"

	"go.etcd.io/bbolt"
)

var (
	db *bbolt.DB
	mu sync.RWMutex
)

func initDB(path string) error {
	var err error
	mu = sync.RWMutex{}
	db, err = bbolt.Open(path, 0655, nil)
	if err != nil {
		return err
	}
	return nil
}

func closeDB() error {
	err := db.Close()
	if err != nil {
		return err
	}
	return nil
}

func put(bucket string, key, value []byte) error {
	mu.Lock()
	defer mu.Unlock()
	
	tx, err := db.Begin(true)

	if err != nil {
		return err
	}

	defer tx.Rollback()

	_, err = tx.CreateBucketIfNotExists([]byte(bucket))
	if err != nil {
		return err
	}
	err = tx.Commit()
	if err != nil {
		return nil
	}

	err = db.Update(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte(bucket))

		if err != nil {
			return err
		}
		err = b.Put(key, value)
		return err
	})
	if err != nil {
		return err
	}
	return nil
}

func get(bucket string, key []byte) []byte {
	mu.RLock()
	defer mu.RUnlock()
	var value []byte
	db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte(bucket))
		value = b.Get(key)
		return nil
	})
	if value != nil {
		return value
	}
	return nil
}

func getAll(bucket string) [][]byte {
	mu.RLock()
	defer mu.RUnlock()

	val := [][]byte{}

	db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket([]byte(bucket))

		if err := b.ForEach(func(k, v []byte) error {
			if v != nil {
				val = append(val, v)
			}
			return nil
		}); err != nil {
			return err
		}
		return nil
	})
	return val
}

func delete(bucket string, key []byte) error {
	mu.Lock()
	defer mu.Unlock()

	tx, err := db.Begin(true)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	err = tx.Commit()
	if err != nil {
		return err
	}

	err = db.Update(
		func(tx *bbolt.Tx) error {
			b := tx.Bucket([]byte(bucket))
			err := b.Delete(key)
			if err != nil {
				return err
			}
			return nil
		})
	if err != nil {
		return err
	}
	return nil
}
