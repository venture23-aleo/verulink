package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
)

var (
	remoteUrl string
	port      string
)

func init() {
	flag.StringVar(&remoteUrl, "remoteUrl", "", "remote url which is to be proxied")
	flag.StringVar(&port, "port", "", "port for running the proxy")
}

func main() {
	flag.Parse()
	if remoteUrl == "" || port == "" {
		panic(flag.ErrHelp)
	}
	remote, err := url.Parse(remoteUrl)
	if err != nil {
		panic(err)
	}

	handler := func(p *httputil.ReverseProxy) func(http.ResponseWriter, *http.Request) {
		return func(w http.ResponseWriter, r *http.Request) {
			log.Println(r.URL)
			r.Host = remote.Host
			w.Header().Set("X-Ben", "Rad")
			p.ServeHTTP(w, r)
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
