package aleo

import (
	"context"
	"fmt"
	"os/exec"

	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/config"
)

const (
	signCmd    = "sign"
	deriveAddr = "derive-addr"
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

func SetUpPrivateKey(keyPair *config.KeyPair) error {
	err := validateAleoPrivateKey(keyPair.PrivateKey, keyPair.WalletAddress)
	if err != nil {
		return err
	}

	sKey = keyPair.PrivateKey
	return nil
}

func validateAleoPrivateKey(privateKey, publicKey string) error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	cmd := exec.CommandContext(ctx, command, deriveAddr, privateKey)
	addrBt, err := cmd.Output()
	if err != nil {
		return err
	}
	if publicKey != string(addrBt) {
		return fmt.Errorf("supplied private key couldnot derive supplied public key")
	}
	return nil
}

func IsAhsCommandAvailable() bool {
	_, err := exec.LookPath(command)
	return err == nil
}
