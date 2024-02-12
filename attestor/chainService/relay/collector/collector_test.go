package collector

import (
	"context"
	"math/big"
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

// func TestSendToCollector(t *testing.T) {

// 	t.Run("case: happy request ", func(t *testing.T) {
// 		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 			w.WriteHeader(http.StatusCreated)
// 		}))
// 		defer ts.Close()

// 		uri := ts.URL
// 		addrs := []string{"aleoaddr", "ethAddr"}
// 		collec := &collector{
// 			uri:              uri,
// 			walletAddresses:  addrs,
// 			collectorWaitDur: time.Second,
// 		}
// 		sp := &chain.ScreenedPacket{
// 			Packet: &chain.Packet{
// 				Source:      chain.NetworkAddress{ChainID: big.NewInt(1)},
// 				Destination: chain.NetworkAddress{ChainID: big.NewInt(2)},
// 				Sequence:    uint64(1)},
// 			IsWhite: true,
// 		}
// 		err := collec.SendToCollector(context.Background(), sp, "sign")
// 		assert.NoError(t, err)
// 	})

// 	t.Run("case: error while requesting bad url", func(t *testing.T) {

// 		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 			w.WriteHeader(http.StatusCreated)
// 		}))

// 		defer ts.Close()

// 		uri := "/bad_url"
// 		addrs := []string{"aleoaddr", "ethAddr"}
// 		collec := &collector{
// 			uri:              uri,
// 			walletAddresses:  addrs,
// 			collectorWaitDur: time.Second,
// 		}
// 		sp := &chain.ScreenedPacket{
// 			Packet: &chain.Packet{
// 				Source:      chain.NetworkAddress{ChainID: big.NewInt(1)},
// 				Destination: chain.NetworkAddress{ChainID: big.NewInt(2)},
// 				Sequence:    uint64(1),
// 			},
// 			IsWhite: true,
// 		}

// 		err := collec.SendToCollector(context.Background(), sp, "sign")
// 		assert.Error(t, err)
// 	})

// 	t.Run("case: bad statuscode on http response", func(t *testing.T) {
// 		statusCode := http.StatusBadRequest
// 		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 			w.WriteHeader(statusCode)
// 		}))

// 		defer ts.Close()

// 		uri := ts.URL
// 		addrs := []string{"aleoaddr", "ethAddr"}
// 		collec := &collector{
// 			uri:              uri,
// 			walletAddresses:  addrs,
// 			collectorWaitDur: time.Second,
// 		}
// 		sp := &chain.ScreenedPacket{
// 			Packet: &chain.Packet{
// 				Source:      chain.NetworkAddress{ChainID: big.NewInt(1)},
// 				Destination: chain.NetworkAddress{ChainID: big.NewInt(2)},
// 				Sequence:    uint64(1)},
// 			IsWhite: true,
// 		}

// 		err := collec.SendToCollector(context.Background(), sp, "sign")
// 		assert.Error(t, err)

// 		expectedErr := fmt.Errorf("expected status code %d, got %d", http.StatusCreated, statusCode)
// 		assert.Equal(t, expectedErr, err)
// 	})
// }

// func TestGetPktsFromCollector(t *testing.T) {

// 	t.Run("case: happy path", func(t *testing.T) {
// 		mPkt := &chain.MissedPacket{
// 			TargetChainID: big.NewInt(1),
// 			SourceChainID: big.NewInt(2),
// 			SeqNum:        uint64(1),
// 			Height:        uint64(55),
// 			TxnID:         "txnid",
// 		}

// 		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 			missedPacket := []*chain.MissedPacket{mPkt}
// 			missedPktBt, _ := json.Marshal(&missedPacket)
// 			w.Write(missedPktBt)
// 		}))
// 		defer ts.Close()

// 		uri := ts.URL
// 		addrs := []string{"aleoaddr", "ethAddr"}
// 		collec := &collector{
// 			uri:              uri,
// 			walletAddresses:  addrs,
// 			collectorWaitDur: time.Second,
// 		}

// 		ctx, cancel := context.WithCancel(context.Background())
// 		defer cancel()
// 		refetchCh := make(chan struct{})
// 		missedCh := make(chan *chain.MissedPacket)
// 		go collec.ReceivePktsFromCollector(ctx, missedCh, refetchCh)

// 		pkt := <-missedCh
// 		assert.Equal(t, mPkt, pkt)
// 	})

// 	t.Run("case: last packet should have IsLast set to true", func(t *testing.T) {
// 		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

// 			missedPacket := []*chain.MissedPacket{}
// 			for i := 0; i < limitSize; i++ {
// 				missedPacket = append(missedPacket, &chain.MissedPacket{
// 					TargetChainID: big.NewInt(1),
// 					SourceChainID: big.NewInt(2),
// 					SeqNum:        uint64(i),
// 					Height:        uint64(55),
// 					TxnID:         "txnid",
// 				})
// 			}
// 			missedPktBt, _ := json.Marshal(&missedPacket)
// 			w.Write(missedPktBt)
// 		}))
// 		defer ts.Close()

// 		uri := ts.URL
// 		addrs := []string{"aleoaddr", "ethAddr"}
// 		collec := &collector{
// 			uri:              uri,
// 			walletAddresses:  addrs,
// 			collectorWaitDur: time.Second,
// 		}

// 		ctx, cancel := context.WithTimeout(context.Background(), time.Second*3)
// 		defer cancel()
// 		refetchCh := make(chan struct{})
// 		missedCh := make(chan *chain.MissedPacket)
// 		go collec.ReceivePktsFromCollector(ctx, missedCh, refetchCh)

// 		for i := uint64(1); i <= uint64(limitSize); i++ {
// 			pkt := <-missedCh
// 			if i == limitSize {
// 				assert.True(t, pkt.IsLast)
// 			} else {
// 				assert.False(t, pkt.IsLast)
// 			}
// 		}
// 	})

// 	t.Run("case: test same url requested if refetching is required", func(t *testing.T) {
// 		var firstUri string
// 		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 			if firstUri == "" {
// 				firstUri = r.RequestURI
// 			} else {
// 				assert.Equal(t, firstUri, r.RequestURI)
// 			}
// 			missedPacket := []*chain.MissedPacket{}
// 			for i := 0; i < limitSize; i++ {
// 				missedPacket = append(missedPacket, &chain.MissedPacket{
// 					TargetChainID: big.NewInt(1),
// 					SourceChainID: big.NewInt(2),
// 					SeqNum:        uint64(i),
// 					Height:        uint64(55),
// 					TxnID:         "txnid",
// 				})
// 			}
// 			missedPktBt, _ := json.Marshal(&missedPacket)
// 			w.Write(missedPktBt)
// 		}))
// 		defer ts.Close()
// 		uri := ts.URL
// 		addrs := []string{"aleoaddr", "ethAddr"}
// 		collec := &collector{
// 			uri:              uri,
// 			walletAddresses:  addrs,
// 			collectorWaitDur: time.Second,
// 		}

// 		ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
// 		defer cancel()

// 		refetchCh := make(chan struct{})
// 		missedCh := make(chan *chain.MissedPacket)
// 		go collec.ReceivePktsFromCollector(ctx, missedCh, refetchCh)
// 		go func() {
// 			time.Sleep(time.Second * 2)
// 			refetchCh <- struct{}{}
// 		}()

// 		for i := uint64(0); i < limitSize*2; i++ {
// 			<-missedCh
// 		}
// 	})

// 	t.Run("case: for refetching not required, different url shoudl be requested", func(t *testing.T) {
// 		var firstUri string
// 		mpkt := &chain.MissedPacket{
// 			TargetChainID: big.NewInt(1),
// 			SourceChainID: big.NewInt(2),
// 			SeqNum:        uint64(1),
// 			Height:        uint64(55),
// 			TxnID:         "txnid",
// 		}
// 		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 			if firstUri == "" {
// 				firstUri = r.RequestURI
// 			} else {
// 				assert.NotEqual(t, firstUri, r.RequestURI)
// 			}
// 			missedPackets := []*chain.MissedPacket{mpkt}

// 			missedPktBt, _ := json.Marshal(&missedPackets)
// 			w.Write(missedPktBt)
// 		}))
// 		defer ts.Close()

// 		uri := ts.URL
// 		addrs := []string{"aleoaddr", "ethAddr"}
// 		collec := &collector{
// 			uri:              uri,
// 			walletAddresses:  addrs,
// 			collectorWaitDur: time.Second,
// 		}

// 		ctx, cancel := context.WithTimeout(context.Background(), time.Second*3)
// 		defer cancel()
// 		refetchCh := make(chan struct{})
// 		missedCh := make(chan *chain.MissedPacket)
// 		go collec.ReceivePktsFromCollector(ctx, missedCh, refetchCh)

// 		for i := uint64(0); i < uint64(2); i++ {
// 			pkt := <-missedCh
// 			assert.False(t, pkt.IsLast)
// 		}
// 	})

// 	t.Run("case: error bad status code", func(t *testing.T) {
// 		var firstUri string
// 		mpkt := &chain.MissedPacket{
// 			TargetChainID: big.NewInt(1),
// 			SourceChainID: big.NewInt(2),
// 			SeqNum:        uint64(1),
// 			Height:        uint64(55),
// 			TxnID:         "txnid",
// 		}

// 		ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
// 			if firstUri == "" {
// 				firstUri = r.RequestURI
// 				w.WriteHeader(http.StatusBadGateway)
// 			} else {
// 				assert.Equal(t, firstUri, r.RequestURI)
// 			}
// 			missedPackets := []*chain.MissedPacket{mpkt}

// 			missedPktBt, _ := json.Marshal(&missedPackets)
// 			w.Write(missedPktBt)
// 		}))
// 		defer ts.Close()

// 		uri := ts.URL

// 		addrs := []string{"aleoaddr", "ethAddr"}
// 		collec := &collector{
// 			uri:              uri,
// 			walletAddresses:  addrs,
// 			collectorWaitDur: time.Second,
// 		}

// 		ctx, cancel := context.WithTimeout(context.Background(), time.Second*3)
// 		defer cancel()
// 		refetchCh := make(chan struct{})
// 		missedCh := make(chan *chain.MissedPacket)
// 		go collec.ReceivePktsFromCollector(ctx, missedCh, refetchCh)

// 		pkt := <-missedCh
// 		assert.False(t, pkt.IsLast)
// 	})
// }

func TestCollector(t *testing.T) {

	uri := "https://aleobridge-dbservice-develop.b08qlu4v33brq.us-east-1.cs.amazonlightsail.com"
	addrs := map[string]string{
		"6694886634403":     "aleo1zgyyxkjxadc4y7aks4rscmz6sq59wljrjckuwgrwsx034uxkkuyqmtjdw7",
		"28556963657430695": "0x5Dc561633F195d44a530CdF0f288a409286797ff"}
	collec := &collector{
		uri:              uri,
		chainIDToAddress: addrs,
		collectorWaitDur: time.Second,
	}
	sp := &chain.ScreenedPacket{
		Packet: &chain.Packet{
			Source:      chain.NetworkAddress{ChainID: big.NewInt(28556963657430695)},
			Destination: chain.NetworkAddress{ChainID: big.NewInt(6694886634403)},
			Sequence:    uint64(1)},
		IsWhite: true,
	}
	signature := "sign1uguve8y68m5r8gmufl2hak3fc8d32x22d2nqn2acsmkca0tzd5pf0an8wsfnncfjf39lp72nfknzt6fe8us85nwl027mnj86srr2cq2qdjw2pe8k4xlkncmertlfmug7vjzqn88v7klz3htq94p48ghezqq4d9mmsnh9kzpy2y33x6j788xp2llppfp6v0kgwgpdxs5208vqchm8a6g"
	pktHash := "1233032529535352533537970719453602118145153682706641379905676168317090198721field"
	err := collec.SendToCollector(context.Background(), sp, pktHash, signature)
	assert.NoError(t, err)
}
