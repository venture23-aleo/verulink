package aleo

import (
	"context"
	"os"
	"os/exec"
)

const (
	signCmd = "sign"
)

var sKey string

func sign(s string) (string, error) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	cmd := exec.CommandContext(ctx, command, signCmd, sKey, s)
	signature, err := cmd.Output()
	if err != nil {
		return "", err
	}

	return string(signature), nil
}

func SetUpPrivateKey(keyPath, decryptKey string) error {
	b, err := os.ReadFile(keyPath)
	if err != nil {
		return err
	}

	sKey = "private key"
	_ = b
	return nil

}

func IsAhsCommandAvailable() bool {
	_, err := exec.LookPath(command)

	if err != nil {
		return false
	}

	return true
}
