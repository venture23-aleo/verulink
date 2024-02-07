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

	fmt.Println("Input ethereum decrypt key")
	_, err = fmt.Scanln(&ethDecryptKey)
	if err != nil {
		return err
	}
	return nil
}
