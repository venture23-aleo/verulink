package collector

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
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

func TestSetupCollector(t *testing.T) {
	uri := "http://collector.url"
	chainIdToAddress := map[string]string{
		"2": "aleoaddr",
		"1": "ethAddr"}
	err := SetupCollector(config.CollecterServiceConfig{Uri: uri,
		CaCertificate:       "../../../chainService/.mtls/ca.cer",
		AttestorCertificate: "../../../chainService/.mtls/attestor1.crt",
		AttestorKey:         "../../../chainService/.mtls/attestor1.key"}, chainIdToAddress, time.Second)
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

		caCert, _ := os.ReadFile("../../../chainService/.mtls/ca.cer")

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		attestorCert, _ := tls.LoadX509KeyPair("../../../chainService/.mtls/attestor1.crt",
			"../../../chainService/.mtls/attestor1.key")
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

		caCert, _ := os.ReadFile("../../../chainService/.mtls/ca.cer")

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		attestorCert, _ := tls.LoadX509KeyPair("../../../chainService/.mtls/attestor1.crt",
			"../../../chainService/.mtls/attestor1.key")
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
		caCert, _ := os.ReadFile("../../../chainService/.mtls/ca.cer")

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		attestorCert, _ := tls.LoadX509KeyPair("../../../chainService/.mtls/attestor1.crt",
			"../../../chainService/.mtls/attestor1.key")
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
			collectorClient: client,
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

		caCert, _ := os.ReadFile("../../../chainService/.mtls/ca.cer")

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		attestorCert, _ := tls.LoadX509KeyPair("../../../chainService/.mtls/attestor1.crt",
			"../../../chainService/.mtls/attestor1.key")
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
			collectorClient: client,
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

		caCert, _ := os.ReadFile("../../../chainService/.mtls/ca.cer")

		caCertPool := x509.NewCertPool()
		caCertPool.AppendCertsFromPEM(caCert)

		attestorCert, _ := tls.LoadX509KeyPair("../../../chainService/.mtls/attestor1.crt",
			"../../../chainService/.mtls/attestor1.key")
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
			collectorClient: client,
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

