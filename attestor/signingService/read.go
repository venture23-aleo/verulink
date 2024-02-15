package main

import (
	"fmt"
)

func readInputs() error {

	fmt.Println("Input aleo decrypt key")
	_, err := fmt.Scanln(&aleoDecryptKey)
	if err != nil {
		return err
	}

	fmt.Println("Input aleo nonce")
	_, err = fmt.Scanln(&aleoDecryptNonce)
	if err != nil {
		return err
	}

	fmt.Println("Input ethereum decrypt key")
	_, err = fmt.Scanln(&ethDecryptKey)
	if err != nil {
		return err
	}
	return nil
}

func readInputsForKeyEncryption() error {
	fmt.Println("Input aleo private key")
	_, err := fmt.Scanln(&aleoPrivateKey)
	if err != nil {
		return err
	}

	for {
		fmt.Println("Input password")
		_, err = fmt.Scanln(&keyPassword)
		if err != nil {
			return err
		}
		fmt.Println("Confirm password")
		_, err = fmt.Scanln(&confirmPassword)
		if err != nil {
			return err
		}

		if keyPassword != confirmPassword {
			fmt.Println("password mismatched. retry")
			continue
		}
		break
	}

	return nil 
}
