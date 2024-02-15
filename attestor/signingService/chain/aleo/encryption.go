package aleo

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"io"

	"golang.org/x/crypto/bcrypt"
)

func EncryptPrivateKey(privateKey, password string) {
	// generate a password that will be used to decrypt the private key from the plain text
	passwordByte, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		panic(err)
	}

	err = bcrypt.CompareHashAndPassword(passwordByte, []byte(password))
	if err != nil {
		panic(err)
	}

	// hash the generated password to be used as a key in NewCipher
	h := sha256.New()
	h.Write(passwordByte)

	key := h.Sum(nil)

	plaintext := []byte(privateKey)

	// encryption

	block, err := aes.NewCipher(key)
	if err != nil {
		panic(err)
	}

	nonce := make([]byte, 12)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		panic(err.Error())
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		panic(err.Error())
	}

	ciphertext := aesgcm.Seal(nil, nonce, plaintext, nil)

	fmt.Println("************************************************")
	fmt.Println("WARNING!!!! keep the decrypt key and nonce safe")
	fmt.Println("************************************************")
	fmt.Printf("decryptKey:         %x\n", passwordByte)
	fmt.Printf("nonce:              %x\n", nonce)
	fmt.Printf("ciphertext:         %x\n", ciphertext)
}
