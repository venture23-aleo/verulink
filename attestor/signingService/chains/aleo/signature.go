package aleo

import (
	"context"
	"os/exec"
)

func SignAleoMessage(hashString string) string {
	skey := Skey()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	cmd := exec.CommandContext(ctx, "ALEOSignature", "sign", skey, hashString)
	signature, err := cmd.Output()
	if err != nil {
		panic(cmd.Err)
	}
	return string(signature)
}

func Skey() string {
	return "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH"
}