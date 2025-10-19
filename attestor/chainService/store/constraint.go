package store

import (
	"encoding/binary"
)

type keyConstraint interface {
	uint64 | ~string | ~[]byte
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

func convertType[T keyConstraint](returnType T, b []byte) T {
	var i any = returnType
	var v any
	switch i.(type) {
	case int64:
		v = int64(binary.BigEndian.Uint64(b))
	case uint64:
		v = binary.BigEndian.Uint64(b)
	case string:
		v = string(b)
	case []byte:
		v = b
	}
	return v.(T)
}
