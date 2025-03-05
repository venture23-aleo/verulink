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
	if r.URL.String() == "/testnet/latest/height" {
		w.Write([]byte("1000"))

	} else if strings.Contains(r.URL.String(), "collector") {

		w.WriteHeader(http.StatusCreated)
		w.Write([]byte("100"))

	} else {
		// /testnet/program/token_bridge_stg_v2.aleo/mapping/out_packets/%7Bchain_id:84532u128,sequence:1u64%7D
		urlList := strings.Split(r.URL.String(), "/")
	
		replacer := strings.NewReplacer("%7B", "", "chain_id:", "", "u128", "", "sequence:", "", "u64", "", "%7D", "")
		

		lastPart := urlList[len(urlList)-1]
		params := strings.Split(lastPart, ",")
		
		chainID := replacer.Replace(params[0])
		
		chainId, err := strconv.Atoi(chainID)
		if err != nil {
			return
		}
		sequence  := replacer.Replace(params[1])
		seqInt, err := strconv.Atoi(sequence)
		if err != nil {
			return
		}
		modelEthAddress := "[ 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 0u8, 20u8, 119u8, 159u8, 153u8, 43u8, 47u8, 44u8, 66u8, 184u8, 102u8, 15u8, 250u8, 66u8, 219u8, 203u8, 60u8, 124u8, 153u8, 48u8, 176u8 ]"
		packet := fmt.Sprintf("{\\n  version: %du8,\\n  sequence: %du64 ,\\n  "+
			"source: {\\n    chain_id: %du128,\\n    addr: %s\\n  },\\n  "+
			"destination: {\\n    chain_id: %du128,\\n    addr: %s},\\n  "+
			"message: {\\n        sender_address: %s,\\n  dest_token_address: %s,\\n  amount: %su128,\\n  receiver_address: %s\\n     },\\n  "+
			"height: %du64\\n}", 0, seqInt, 6694886634403, "aleo1fcg4k0sacadavag292p7x9ggm6889aay6wn9m8ftnmynh67cg5xsx8ycu8",
			chainId, modelEthAddress,
			"aleo1fcg4k0sacadavag292p7x9ggm6889aay6wn9m8ftnmynh67cg5xsx8ycu8", modelEthAddress,
			"100", modelEthAddress, 1002)

		w.Write([]byte(packet))

		// randomNumber := rand.Int()
		// fmt.Println("the random number is ", randomNumber)
		// if randomNumber%2 == 0 {
		// 	fmt.Println("sendign packet ")
		// 	w.Write([]byte(packet))
		// } else {
		// 	w.Write([]byte("null"))
		// }
	}
}
