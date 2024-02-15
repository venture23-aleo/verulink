package main

import (
	"fmt"
	"os"
	"golang.org/x/term"
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
		// read password without echoing in the terminal
		oldState, err := term.MakeRaw(int(os.Stdin.Fd()))
		if err != nil {
			return err
		}

		fmt.Print("\nInput password:: ")
		password, err := term.ReadPassword(int(os.Stdin.Fd()))
		if err != nil {
			return err
		}
		term.Restore(int(os.Stdin.Fd()), oldState)

		keyPassword = string(password)

		fmt.Print("\nConfirm password:: ")
		password, err = term.ReadPassword(int(os.Stdin.Fd()))
		if err != nil {
			return err
		}
		term.Restore(int(os.Stdin.Fd()), oldState)

		confirmPassword = string(password)

		if keyPassword != confirmPassword {
			fmt.Println("password mismatched. retry")
			continue
		}
		break
	}
	fmt.Println()
	return nil
}
