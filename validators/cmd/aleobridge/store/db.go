package store

import "errors"

func InitKVStore() {
	initDB()
}

// key can have separate bucket to be stored on, so if key is to be store is bucket A then it can be named as
// StoreInBucketA or if it is storing some state then it can be named as StoreState and pass bucket name
// as parameter to put() function in bolt.go
func StoreXXX(key, value interface{}) error {

	err := put(nil, nil, nil)
	if err != nil {
		// log error
	}

	return errors.New("wrap above error")
}

func GetXXX(key string) {
	get(nil, []byte(key))
}

func DeleteXXX(key string) {

}
