package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"strconv"
	"strings"
)

var (
	remoteUrl string
	port      string
	benchMark bool
)

func init() {
	flag.StringVar(&remoteUrl, "remoteUrl", "", "remote url which is to be proxied")
	flag.StringVar(&port, "port", "", "port for running the proxy")
	flag.BoolVar(&benchMark, "benchMark", false, "benchmarking the relayer")
}

func main() {
	flag.Parse()
	if remoteUrl == "" || port == "" {
		panic(flag.ErrHelp)
	}
	fmt.Println("proxy bench", benchMark)
	remote, err := url.Parse(remoteUrl)
	if err != nil {
		panic(err)
	}

	handler := func(p *httputil.ReverseProxy) func(http.ResponseWriter, *http.Request) {
		return func(w http.ResponseWriter, r *http.Request) {
			log.Println(r.URL)
			r.Host = remote.Host
			w.Header().Set("X-Ben", "Rad")
			if benchMark {
				serveHttp(w, r)
			} else {
				p.ServeHTTP(w, r)
			}
		}
	}

	proxy := httputil.NewSingleHostReverseProxy(remote)
	http.HandleFunc("/", handler(proxy))
	fmt.Println(os.Getpid())
	err = http.ListenAndServe(":"+port, nil)
	if err != nil {
		panic(err)
	}
}

func serveHttp(w http.ResponseWriter, r *http.Request) {
	if r.URL.String() == "/testnet3/latest/height" {
		w.Write([]byte("1000"))
	} else {
		urlList := strings.Split(r.URL.String(), "/")

		replacer := strings.NewReplacer("sequence:", "", "u64", "", "%7D", "")

		seq := replacer.Replace(strings.Split(urlList[len(urlList)-1], ",")[1])
		seqInt, err := strconv.Atoi(seq)
		if err != nil {
			return
		}
		modelEthAddress := "[ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ]"
		packet := fmt.Sprintf("{\\n  version: %du8,\\n  sequence: %du64 ,\\n  "+
			"source: {\\n    chain_id: %du128,\\n    addr: %s\\n  },\\n  "+
			"destination: {\\n    chain_id: %du128,\\n    addr: %s},\\n  "+
			"message: {\\n        sender_address: %s,\\n  dest_token_address: %s,\\n  amount: %su128,\\n  receiver_address: %s\\n     },\\n  "+
			"height: %du64\\n}", 0, seqInt, 6694886634403, "aleo18wf4ggxpmey0hk3drgefdgup9xnudgekas9lvpzut3f4cf8scuzq78j08l",
			28556963657430695, modelEthAddress,
			"aleo1tvuwdl7remyvccqypa5lzehrdd5tnqpuy49jv7h6uw5au67pkupsjljwgn", modelEthAddress,
			"100", modelEthAddress, 105)

		w.Write([]byte(packet))
	}
}
