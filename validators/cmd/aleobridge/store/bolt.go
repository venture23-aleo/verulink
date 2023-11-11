package store

import "go.etcd.io/bbolt"

var db *bbolt.DB

func initDB( /*Add required parameters like filepath for db, and params for fine tuning db*/ ) {
	// panic if initialization fails

	//populate above db variable
	var err error
	db, err = bbolt.Open("", 655, nil)
	if err != nil {
		panic(err)
	}
}

func put(bktName, key, value []byte) error {
	return nil
}

func get(butName, key []byte) []byte {
	return nil
}

func delete(key []byte) {

}
