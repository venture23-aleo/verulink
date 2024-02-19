package collector

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
)

func TestSetupCollector(t *testing.T) {
	uri := "http://collector.url"
	chainIdToAddress := map[string]string{
		"2": "aleoaddr",
		"1": "ethAddr"}
	err := SetupCollector(uri, chainIdToAddress, time.Second)
	assert.NoError(t, err)
	assert.NotNil(t, GetCollector())
	assert.Equal(t, uri, collc.uri)
	assert.Equal(t, chainIdToAddress, collc.chainIDToAddress)
}

func TestSendToCollector(t *testing.T) {

	t.Run("case: happy request ", func(t *testing.T) {
		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusCreated)
		}))
		defer ts.Close()

		uri := ts.URL
		chainIdToAddress := map[string]string{
			"2": "aleoaddr",
			"1": "ethAddr",
		}
		collec := &collector{
			uri:              uri,
			chainIDToAddress: chainIdToAddress,
			collectorWaitDur: time.Second,
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
		collec := &collector{
			uri:              uri,
			chainIDToAddress: chainIdToAddress,
			collectorWaitDur: time.Second,
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
		collec := &collector{
			uri:              uri,
			chainIDToAddress: chainIdToAddress,
			collectorWaitDur: time.Second,
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

	t.Run("case: happy path", func(t *testing.T) {
		mPkt := &chain.MissedPacket{
			TargetChainID: big.NewInt(1),
			SourceChainID: big.NewInt(2),
			SeqNum:        uint64(1),
			Height:        uint64(55),
			TxnID:         "txnid",
		}

		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			missedPacket := []*chain.MissedPacket{mPkt}
			missedPktBt, _ := json.Marshal(&missedPacket)
			w.Write(missedPktBt)
		}))
		defer ts.Close()

		uri := ts.URL
		chainIdToAddress := map[string]string{
			"2": "aleoaddr",
			"1": "ethAddr",
		}
		collec := &collector{
			uri:              uri,
			chainIDToAddress: chainIdToAddress,
			collectorWaitDur: time.Second,
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
		mpkt := &chain.MissedPacket{
			TargetChainID: big.NewInt(1),
			SourceChainID: big.NewInt(2),
			SeqNum:        uint64(1),
			Height:        uint64(55),
			TxnID:         "txnid",
		}

		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if firstUri == "" {
				firstUri = r.RequestURI
				w.WriteHeader(http.StatusBadGateway)
			} else {
				assert.Equal(t, firstUri, r.RequestURI)
			}
			missedPackets := []*chain.MissedPacket{mpkt}

			missedPktBt, _ := json.Marshal(&missedPackets)
			w.Write(missedPktBt)
		}))
		defer ts.Close()

		uri := ts.URL

		chainIdToAddress := map[string]string{
			"2": "aleoaddr",
			"1": "ethAddr",
		}
		collec := &collector{
			uri:              uri,
			chainIDToAddress: chainIdToAddress,
			collectorWaitDur: time.Second,
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
