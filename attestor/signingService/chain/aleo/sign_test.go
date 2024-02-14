package aleo

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSetupPrivateKey(t *testing.T) {
	t.Run("case: happy path", func(t *testing.T) {
		err := os.WriteFile("aleo.key", []byte("197b06966ff990f9b4734f35af48125573a4ce422ec457c1f7a0fc6281a89ad0818f3ca416de22ebc979bfb233e40dc0c7f5aeb9dbc068f692c7223a78891560b23ac651fb4382b7b52660"), 0755)
		assert.NoError(t, err)

		t.Cleanup(func() {
			os.Remove("aleo.key")
		})

		err = SetUpPrivateKey("aleo.key", "243261243130246348444b486748647979594a2e4a6e4c6f685661762e79794c556b565a3138354d464f4235395a6c513962546f6b4c543141577036", "031472b63eb52843dbf692b8")
		assert.NoError(t, err)
		assert.Equal(t, sKey, "APrivateKey1zkpHq4te4x5Gmma3FktMWTBWR8hvZapRTbtHAwr9TbNRWKP")
	})
	t.Run("case: wrong decrpytion key", func(t *testing.T) {
		err := os.WriteFile("aleo.key", []byte("197b06966ff990f9b4734f35af48125573a4ce422ec457c1f7a0fc6281a89ad0818f3ca416de22ebc979bfb233e40dc0c7f5aeb9dbc068f692c7223a78891560b23ac651fb4382b7b52660"), 0755)
		assert.NoError(t, err)

		t.Cleanup(func() {
			os.Remove("aleo.key")
		})

		err = SetUpPrivateKey("aleo.key", "43261243130246348444b486748647979594a2e4a6e4c6f685661762e79794c556b565a3138354d464f4235395a6c513962546f6b4c543141577036", "031472b63eb52843dbf692b8")
		assert.Error(t, err)
	})
}
