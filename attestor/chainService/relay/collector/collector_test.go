package collector

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/verulink/attestor/chainService/chain"
	"github.com/venture23-aleo/verulink/attestor/chainService/config"
)

var caPath, attestorCertPath, attestorKeyPath string

func TestMain(m *testing.M) {
	caPath, attestorCertPath, attestorKeyPath = generateDummyCertFiles()

	// Run all tests
	exitCode := m.Run()

	// Cleanup
	os.Remove(caPath)
	os.Remove(attestorCertPath)
	os.Remove(attestorKeyPath)

	// Exit with the correct code
	os.Exit(exitCode)
}


func TestSetupCollector(t *testing.T) {
	uri := "http://collector.url"
	chainIdToAddress := map[string]string{
		"2": "aleoaddr",
		"1": "ethAddr"}
	err := SetupCollector(config.CollecterServiceConfig{Uri: uri,
		CaCertificate:       caPath,
		AttestorCertificate: attestorCertPath,
		AttestorKey:         attestorKeyPath}, chainIdToAddress, time.Second)
	assert.NoError(t, err)
	assert.NotNil(t, GetCollector())
	assert.Equal(t, uri, collc.uri)
	assert.Equal(t, chainIdToAddress, collc.chainIDToAddress)
}

func TestSendToCollector(t *testing.T) {

	t.Run("case: happy request ", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusCreated)
			w.Write([]byte(`{"message":"create"}`))
		}))
		defer ts.Close()

		uri := ts.URL
		chainIdToAddress := map[string]string{
			"2": "aleoaddr",
			"1": "ethAddr",
		}

		caCert, _ := os.ReadFile(caPath)

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		attestorCert, _ := tls.LoadX509KeyPair(attestorCertPath, attestorKeyPath)
		client := &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					RootCAs:      caCertPool,
					Certificates: []tls.Certificate{attestorCert},
				},
			},
		}
		collec := &collector{
			uri:              uri,
			chainIDToAddress: chainIdToAddress,
			collectorWaitDur: time.Second,
			collectorClient:  client,
		}
		sp := &chain.ScreenedPacket{
			Packet: &chain.Packet{
				Source:      chain.NetworkAddress{ChainID: big.NewInt(1)},
				Destination: chain.NetworkAddress{ChainID: big.NewInt(2)},
				Sequence:    uint64(1)},
			IsWhite: true,
		}
		err := collec.SendToCollector(context.Background(), sp, "packet_hash", "sign")
		assert.NoError(t, err)
	})

	t.Run("case: error while requesting bad url", func(t *testing.T) {

		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusCreated)
		}))

		defer ts.Close()

		uri := "/bad_url"
		chainIdToAddress := map[string]string{
			"2": "aleoaddr",
			"1": "ethAddr",
		}

		caCert, _ := os.ReadFile(caPath)

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		attestorCert, _ := tls.LoadX509KeyPair(attestorCertPath, attestorKeyPath)
		client := &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					RootCAs:      caCertPool,
					Certificates: []tls.Certificate{attestorCert},
				},
			},
		}

		collec := &collector{
			uri:              uri,
			chainIDToAddress: chainIdToAddress,
			collectorWaitDur: time.Second,
			collectorClient:  client,
		}
		sp := &chain.ScreenedPacket{
			Packet: &chain.Packet{
				Source:      chain.NetworkAddress{ChainID: big.NewInt(1)},
				Destination: chain.NetworkAddress{ChainID: big.NewInt(2)},
				Sequence:    uint64(1),
			},
			IsWhite: true,
		}

		err := collec.SendToCollector(context.Background(), sp, "packet_hash", "sign")
		assert.Error(t, err)
	})

	t.Run("case: bad statuscode on http response", func(t *testing.T) {
		statusCode := http.StatusBadRequest
		responseMsg := "bad response"
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(statusCode)
			w.Write([]byte(responseMsg))
		}))

		defer ts.Close()

		uri := ts.URL
		chainIdToAddress := map[string]string{
			"2": "aleoaddr",
			"1": "ethAddr",
		}
		caCert, _ := os.ReadFile(caPath)

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		attestorCert, _ := tls.LoadX509KeyPair(attestorCertPath, attestorKeyPath)
		client := &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					RootCAs:      caCertPool,
					Certificates: []tls.Certificate{attestorCert},
				},
			},
		}
		collec := &collector{
			uri:              uri,
			chainIDToAddress: chainIdToAddress,
			collectorWaitDur: time.Second,
			collectorClient:  client,
		}
		sp := &chain.ScreenedPacket{
			Packet: &chain.Packet{
				Source:      chain.NetworkAddress{ChainID: big.NewInt(1)},
				Destination: chain.NetworkAddress{ChainID: big.NewInt(2)},
				Sequence:    uint64(1)},
			IsWhite: true,
		}

		err := collec.SendToCollector(context.Background(), sp, "packet_hash", "sign")
		assert.Error(t, err)

		expectedErr := fmt.Errorf(
			"expected status code %d, got %d, response: %s", http.StatusCreated, statusCode, responseMsg)

		assert.Equal(t, expectedErr, err)
	})
}

func TestGetPktsFromCollector(t *testing.T) {

	// setting json response form server
	mPktString := &struct {
		TargetChainID string `json:"destChainId"`
		SourceChainID string `json:"sourceChainId"`
		SeqNum        uint64 `json:"sequence"`
		Height        uint64 `json:"height"`
		TxnID         string `json:"transactionHash"`
	}{
		TargetChainID: "1",
		SourceChainID: "2",
		SeqNum:        1,
		Height:        55,
		TxnID:         "txnid",
	}

	mPktInfoString := &struct {
		Data []*struct {
			TargetChainID string `json:"destChainId"`
			SourceChainID string `json:"sourceChainId"`
			SeqNum        uint64 `json:"sequence"`
			Height        uint64 `json:"height"`
			TxnID         string `json:"transactionHash"`
		} `json:"data"`
		Message string `json:"message"`
	}{
		Data: []*struct {
			TargetChainID string `json:"destChainId"`
			SourceChainID string `json:"sourceChainId"`
			SeqNum        uint64 `json:"sequence"`
			Height        uint64 `json:"height"`
			TxnID         string `json:"transactionHash"`
		}{mPktString},
		Message: "Test message",
	}

	t.Run("case: happy path", func(t *testing.T) {

		// expected response
		mPkt := &chain.MissedPacket{
			TargetChainID: big.NewInt(1),
			SourceChainID: big.NewInt(2),
			SeqNum:        uint64(1),
			Height:        uint64(55),
			TxnID:         "txnid",
		}

		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			missedPktBt, _ := json.Marshal(&mPktInfoString)
			w.Write(missedPktBt)
		}))
		defer ts.Close()

		uri := ts.URL
		chainIdToAddress := map[string]string{
			"2": "aleoaddr",
			"1": "ethAddr",
		}

		caCert, _ := os.ReadFile(caPath)

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		attestorCert, _ := tls.LoadX509KeyPair(attestorCertPath, attestorKeyPath)
		client := &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					RootCAs:      caCertPool,
					Certificates: []tls.Certificate{attestorCert},
				},
			},
		}
		collec := &collector{
			uri:              uri,
			chainIDToAddress: chainIdToAddress,
			collectorWaitDur: time.Second,
			collectorClient:  client,
		}

		ctx, cancel := context.WithCancel(context.Background())
		defer cancel()
		missedCh := make(chan *chain.MissedPacket)
		go collec.ReceivePktsFromCollector(ctx, missedCh)

		pkt := <-missedCh
		assert.Equal(t, mPkt, pkt)
	})

	t.Run("case: error bad status code", func(t *testing.T) {
		var firstUri string

		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if firstUri == "" {
				firstUri = r.RequestURI
				w.WriteHeader(http.StatusBadGateway)
			} else {
				assert.Equal(t, firstUri, r.RequestURI)
			}
			missedPktBt, _ := json.Marshal(&mPktInfoString)
			w.Write(missedPktBt)
		}))
		defer ts.Close()

		uri := ts.URL

		chainIdToAddress := map[string]string{
			"2": "aleoaddr",
			"1": "ethAddr",
		}

		caCert, _ := os.ReadFile(caPath)

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		attestorCert, _ := tls.LoadX509KeyPair(attestorCertPath, attestorKeyPath)
		client := &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{
					RootCAs:      caCertPool,
					Certificates: []tls.Certificate{attestorCert},
				},
			},
		}
		collec := &collector{
			uri:              uri,
			chainIDToAddress: chainIdToAddress,
			collectorWaitDur: time.Second,
			collectorClient:  client,
		}

		ctx, cancel := context.WithTimeout(context.Background(), time.Second*3)
		defer cancel()
		missedCh := make(chan *chain.MissedPacket)
		go collec.ReceivePktsFromCollector(ctx, missedCh)
		select {
		case <-ctx.Done():
			t.Fail()
		case <-missedCh:
		}
	})
}

// helper function to create keys
func generateDummyCertFiles() (caCertPath, attestorCertPath, attestorKeyPath string) {

	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		log.Fatalf("error generating key")
	}

	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			CommonName: "localhost",
		},
		NotBefore: time.Now(),
		NotAfter:  time.Now().Add(1 * time.Hour),

		KeyUsage:    x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}

	// Self-signed cert
	certDER, err := x509.CreateCertificate(rand.Reader, &template, &template, &priv.PublicKey, priv)
	if err != nil {
		log.Fatalf(err.Error())
	}

	// Write cert
	certFile, err := os.CreateTemp("", "cert-*.pem")
	if err != nil {
		log.Fatalf(err.Error())
	}
	defer certFile.Close()
	pem.Encode(certFile, &pem.Block{Type: "CERTIFICATE", Bytes: certDER})

	// Write key
	keyFile, err := os.CreateTemp("", "key-*.pem")
	if err != nil {
		log.Fatalf(err.Error())
	}
	defer keyFile.Close()
	keyBytes := x509.MarshalPKCS1PrivateKey(priv)
	pem.Encode(keyFile, &pem.Block{Type: "RSA PRIVATE KEY", Bytes: keyBytes})

	// For testing, use the same cert as CA and Attestor
	return certFile.Name(), certFile.Name(), keyFile.Name()
}
