package store

import (
	"encoding/json"

	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
)

var (
	RetryBucket = "retryBucket"
)

func InitKVStore() {
	initDB("database")
}

// key can have separate bucket to be stored on, so if key is to be store is bucket A then it can be named as
// StoreInBucketA or if it is storing some state then it can be named as StoreState and pass bucket name
// as parameter to put() function in bolt.go
func StoreRetryPacket(dst, key string, value *chain.QueuedMessage) error {
	bucket := getRetryBucketName(dst)
	val, err := json.Marshal(value)
	if err != nil {
		return err
	}
	err = put(bucket, []byte(key), val)
	if err != nil {
		return err
	}
	return nil
}

func GetRetryPacket(dst, key string) (*chain.QueuedMessage, error) {
	bucket := getRetryBucketName(dst)
	value := get(bucket, []byte(key))

	msg := &chain.QueuedMessage{}

	err := json.Unmarshal(value, msg)
	if err != nil {
		return nil, err
	}
	return msg, nil
}

func getRetryBucketName(dst string) string {
	return RetryBucket + "|" + dst
}

func DeleteRetryPacket(dst, key string) error {
	bucket := getRetryBucketName(dst)
	err := delete(bucket, []byte(key))
	if err != nil {
		return err
	}
	return nil
}

func CloseDB() error {
	err := closeDB()
	if err != nil {
		return err
	}
	return nil
}
