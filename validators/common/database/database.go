package database

import (
	"encoding/json"
	"fmt"

	"github.com/boltdb/bolt"
)

type Database struct {
	Db *bolt.DB
}

func NewDatabase(path string) (*Database, error) {
	db, err := bolt.Open(path, 0777, nil)
	if err != nil {
		return nil, err
	}

	return &Database{db}, nil
}

func (d *Database) CloseDatabase() error {
	err := d.Db.Close()
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) DbPut(bucket string, key string, value interface{}) error {
	tx, err := d.Db.Begin(true)
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

	d.Db.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(bucket))
		val, err := json.Marshal(value)
		if err != nil {
			return err
		}
		err = b.Put([]byte(key), val)
		return err
	})
	return nil
}

func (d *Database) ViewData(bucket, key string) error {
	d.Db.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte(bucket))
		v := b.Get([]byte(key))
		fmt.Println(string(v))
		return nil
	})
	return nil
}
