package collector

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/logger"
)

const (
	signatureEndPoint   = "signature"
	unconfirmedEndPoint = "unconfirmed"
	aleoTrue            = "true"
)

// request body fields
const (
	srcChainID     = "sourceChainId"
	destChainID    = "destChainId"
	seqNum         = "sequence"
	isWhite        = "offChainAnalysis"
	signature      = "signature"
	packetHash     = "packetHash"
	attestorSigner = "attestorSigner"
)

// query params
const (
	address     = "address"
	unconfirmed = "unconfirmed"
	limit       = "limit"
	limitSize   = 20
)

type CollectorI interface {
	SendToCollector(ctx context.Context, sp *chain.ScreenedPacket, pktHash, sig string) error
	ReceivePktsFromCollector(ctx context.Context, ch chan<- *chain.MissedPacket)
}

var collc collector

type collector struct {
	uri              string
	chainIDToAddress map[string]string // chainID: walletAddress
	collectorWaitDur time.Duration
}

// SendToCollector sends the signed packets to the collector service aka db-service
func (c *collector) SendToCollector(ctx context.Context, sp *chain.ScreenedPacket, pktHash, sig string) error {
	params := map[string]interface{}{
		srcChainID:     sp.Packet.Source.ChainID.String(),
		destChainID:    sp.Packet.Destination.ChainID.String(),
		seqNum:         sp.Packet.Sequence,
		signature:      sig,
		isWhite:        sp.IsWhite,
		attestorSigner: c.chainIDToAddress[sp.Packet.Destination.ChainID.String()],
		packetHash:     pktHash,
	}

	data, err := json.Marshal(params)
	if err != nil {
		return err
	}

	u, err := url.Parse(c.uri)
	if err != nil {
		return err
	}
	u = u.JoinPath(signatureEndPoint)
	queryParams := url.Values{}
	if sp.Packet.IsMissed() {
		queryParams.Set(unconfirmed, "true")
	}

	u.RawQuery = queryParams.Encode()
	buf := bytes.NewBuffer(data)

	ctx, cncl := context.WithTimeout(ctx, time.Minute)
	defer cncl()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u.String(), io.NopCloser(buf))
	if err != nil {
		return err
	}

	req.Header.Set("content-type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusCreated {
		return nil
	}
	r, _ := io.ReadAll(resp.Body)
	return fmt.Errorf("expected status code %d, got %d, response: %s", http.StatusCreated, resp.StatusCode, string(r))
}

// ReceivePktsFromCollector queries the db-service for information of packets that has to be processed again
func (c *collector) ReceivePktsFromCollector(ctx context.Context, ch chan<- *chain.MissedPacket) {

	if len(c.chainIDToAddress) == 0 {
		return
	}

	dur := c.collectorWaitDur
	if dur == 0 {
		dur = time.Hour
	}
	ticker := time.NewTicker(dur)
	defer ticker.Stop()

	var walletAddresses []string
	for _, add := range c.chainIDToAddress {
		walletAddresses = append(walletAddresses, add)
	}

	nextAddressIndex := 0

	for {

		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}

		var (
			missedPackets   []*chain.MissedPacket
			err             error
			resp            *http.Response
			data            []byte
			shouldCloseBody bool
		)
		u, _ := url.Parse(c.uri)
		u = u.JoinPath(unconfirmed)
		queryParams := url.Values{}
		queryParams.Set(address, walletAddresses[nextAddressIndex])
		queryParams.Set(limit, strconv.Itoa(limitSize))
		u.RawQuery = queryParams.Encode()

		ctx, cncl := context.WithTimeout(ctx, time.Minute)
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
		if err != nil {
			goto postFor
		}

		resp, err = http.DefaultClient.Do(req)
		if err != nil {
			goto postFor
		}
		shouldCloseBody = true
		if resp.StatusCode != http.StatusOK {
			err = fmt.Errorf("unexpected status code %d", resp.StatusCode)
			goto postFor
		}

		data, err = io.ReadAll(resp.Body)
		if err != nil {
			goto postFor
		}
		err = json.Unmarshal(data, &missedPackets)

	postFor:
		cncl()
		if shouldCloseBody {
			resp.Body.Close()
		}
		if err != nil { // for non nil error it should wait on ticker
			logger.GetLogger().Error(err.Error())
			continue
		}

		for _, m := range missedPackets {
			ch <- m
		}
		nextAddressIndex = (nextAddressIndex + 1) % len(walletAddresses)
	}
}

func GetCollector() CollectorI {
	return &collc
}

func SetupCollector(url string, chainIDToAddress map[string]string, waitTime time.Duration) error {
	collc = collector{
		uri:              url,
		collectorWaitDur: waitTime,
		chainIDToAddress: make(map[string]string),
	}

	for k, v := range chainIDToAddress {
		collc.chainIDToAddress[k] = v
	}

	return nil
}
