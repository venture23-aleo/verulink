package store

import (
	"encoding/binary"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestConvertKey(t *testing.T) {
	keys := []interface{}{
		"key",
		uint64(23),
		int64(32),
		[]byte("byteKey"),
	}

	for _, k := range keys {
		switch v := k.(type) {
		case string:
			key := convertType("", []byte(v))
			require.Equal(t, k, key)
		case uint64:
			b := make([]byte, 8)
			binary.BigEndian.PutUint64(b, v)
			key := convertType(uint64(0), b)
			require.Equal(t, k, key)
		case []byte:
			key := convertType([]byte{}, v)
			require.Equal(t, k, key)
		}
	}
}

func TestGetKeyByteForKeyConstraint(t *testing.T) {
	keys := []interface{}{
		"key",
		uint64(23),
		int64(32),
		[]byte("byteKey"),
	}

	for _, k := range keys {
		switch v := k.(type) {
		case string:
			key := getKeyByteForKeyConstraint(v)
			require.Equal(t, []byte(v), key)
		case uint64:
			key := getKeyByteForKeyConstraint(v)
			expectedValue := make([]byte, 8)
			binary.BigEndian.PutUint64(expectedValue, v)
			require.Equal(t, expectedValue, key)
		case []byte:
			key := convertType([]byte{}, v)
			require.Equal(t, v, key)
		}
	}
}
