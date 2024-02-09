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

// query params
const (
	address     = "address"
	srcChainID  = "src_chain_id"
	destChainID = "dest_chain_id"
	seqNum      = "seq_num"
	isWhite     = "is_white"
	unconfirmed = "unconfirmed"
	limit       = "limit"
	limitSize   = 20
)

type CollectorI interface {
	SendToCollector(ctx context.Context, sp *chain.ScreenedPacket, signature string) error
	ReceivePktsFromCollector(ctx context.Context, ch chan<- *chain.MissedPacket, refetchCh <-chan struct{})
}

var collc collector

type collector struct {
	uri              string
	walletAddresses  []string
	collectorWaitDur time.Duration
}

func (c *collector) SendToCollector(ctx context.Context, sp *chain.ScreenedPacket, signature string) error {
	params := map[string]interface{}{
		srcChainID:  sp.Packet.Source.ChainID,
		destChainID: sp.Packet.Destination.ChainID,
		seqNum:      sp.Packet.Sequence,
		signature:   signature,
		isWhite:     sp.IsWhite,
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

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}

	if resp.StatusCode == http.StatusCreated {
		return nil
	}
	return fmt.Errorf("expected status code %d, got %d", http.StatusCreated, resp.StatusCode)
}

func (c *collector) ReceivePktsFromCollector(
	ctx context.Context, ch chan<- *chain.MissedPacket, refetchCh <-chan struct{}) {
	ticker := time.NewTicker(c.collectorWaitDur)

	if len(c.walletAddresses) == 0 {
		return
	}

	shouldRefetch := false
	nextAddressIndex := 0

	defer ticker.Stop()
	for {
		if shouldRefetch {
			select {
			case <-ctx.Done():
				return
			case <-refetchCh:
			}
		} else {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
			}
		}

		var (
			missedPackets []*chain.MissedPacket
			err           error
			resp          *http.Response
			data          []byte
		)
		u, _ := url.Parse(c.uri)
		u = u.JoinPath(unconfirmed)
		queryParams := url.Values{}
		queryParams.Set(address, c.walletAddresses[nextAddressIndex])
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
		resp.Body.Close()

		if err != nil { // for non nil error it should wait on ticker
			logger.GetLogger().Error(err.Error())
			shouldRefetch = false
			continue
		}

		shouldRefetch = len(missedPackets) == limitSize
		if shouldRefetch {
			lastInd := len(missedPackets) - 1
			missedPackets[lastInd].IsLast = true
		} else {
			nextAddressIndex = (nextAddressIndex + 1) % len(c.walletAddresses)
		}

		for _, m := range missedPackets {
			ch <- m
		}
	}
}

func GetCollector() CollectorI {
	return &collc
}

func SetupCollector(url string, walletAddresses []string, waitTime time.Duration) error {
	collc = collector{
		uri:              url,
		collectorWaitDur: waitTime,
	}
	collc.walletAddresses = make([]string, len(walletAddresses))
	copy(collc.walletAddresses, walletAddresses)
	return nil
}
