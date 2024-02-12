package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/chain"
	"github.com/venture23-aleo/aleo-bridge/attestor/signingService/config"
)

// response body fields
const (
	signatureField = "signature"
	hashField      = "hash"
)

var methodErr = func(s string) string {
	return fmt.Sprintf("method %s not supported", s)
}

func registerHandlers() {
	http.HandleFunc("/sign", func(w http.ResponseWriter, r *http.Request) {
		r.Close = true

		username, password, _ := r.BasicAuth()
		cfgUser, cfgPass := config.GetUsernamePassword()
		fmt.Println("Server: ", cfgUser, cfgPass)
		fmt.Println("Client: ", username, password)

		if username != cfgUser || password != cfgPass {
			w.WriteHeader(http.StatusForbidden)
			return
		}

		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusBadRequest)
			msg := methodErr(r.Method)
			w.Write([]byte(msg))
			return
		}

		var err error

		defer func() {
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				w.Write([]byte(err.Error()))
			}
		}()

		var data []byte
		data, err = io.ReadAll(r.Body)
		if err != nil {
			return
		}

		var hash, signature string
		hash, signature, err = chain.HashAndSign(data)
		if err != nil {
			return
		}

		m := map[string]string{
			signatureField: signature,
			hashField:      hash,
		}
		respData, _ := json.Marshal(m)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(respData))
	})
}

func serve() {
	network := fmt.Sprintf("%s:%d", address, port)
	log.Fatal(http.ListenAndServe(network, nil))
}
