package aleo

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/hex"
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

func SetUpPrivateKey(keyPath, decrpytKeyString string, nonceStr string) error {
	b, err := os.ReadFile(keyPath)
	if err != nil {
		return err
	}
	ciphertext := string(b)

	keyBt, err := hex.DecodeString(decrpytKeyString)
	if err != nil {
		return err
	}

	h := sha256.New()
	h.Write(keyBt)

	key := h.Sum(nil)

	block, err := aes.NewCipher(key)
	if err != nil {
		return err
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		return err
	}

	nonceBt, err := hex.DecodeString(nonceStr)
	if err != nil {
		return err
	}

	cipherTextBt, err := hex.DecodeString(ciphertext)
	if err != nil {
		return err
	}

	plaintext, err := aesgcm.Open(nil, nonceBt, cipherTextBt, nil)
	if err != nil {
		return err
	}

	sKey = string(plaintext)
	return nil
}

func IsAhsCommandAvailable() bool {
	_, err := exec.LookPath(command)
	return err == nil
}
