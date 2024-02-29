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

// sign returns the schnorr signature of the input string by calling a rust executable.
// The input string must be able to be casted to plaintext type of ALEO. Random string
// that cannot be casted to plaintext format cannot be signed.
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

// SetUpPrivateKey accepts private-key, address pair, validates the private key and sets sKey
func SetUpPrivateKey(keyPair *config.KeyPair) error {
	err := validateAleoPrivateKey(keyPair.PrivateKey, keyPair.WalletAddress)
	if err != nil {
		return err
	}

	sKey = keyPair.PrivateKey
	return nil
}

// validateAleoPrivateKey validates private-key by comparing the address derived from private key
// with the provided wallet address
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

// IsAhsCommandAvailable validates if the rust executable which is needed for hashing and signing is
// added to the $PATH variable. If it returns false, the executable has to be included in the $PATH
func IsAhsCommandAvailable() bool {
	_, err := exec.LookPath(command)
	return err == nil
}
