package store

import "encoding/binary"

type keyConstraint interface {
	int64 | uint64 | ~string | ~[]byte
}

func getKeyByteForKeyConstraint[T keyConstraint](key T) (k []byte) {
	var i interface{} = key
	switch v := i.(type) {
	case int64:
		k = make([]byte, 8)
		binary.BigEndian.PutUint64(k, uint64(v))
	case uint64:
		k = make([]byte, 8)
		binary.BigEndian.PutUint64(k, v)
	case string:
		k = []byte(v)
	case []byte:
		k = v
	}
	return
}
