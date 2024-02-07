package collector

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
)

// params
const (
	srcChainID  = "src_chain_id"
	destChainID = "dest_chain_id"
	seqNum      = "seq_num"
	signature   = "signature"
	isWhite     = "is_white"

	queryKey     = "is_unconfirmed"
	unconfirmed  = "unconfirmed"
	address      = "address"
	limit        = "limit"
	limitSize    = "20"
	limitSizeInt = 20
	aleoTrue     = "true"
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
	u = u.JoinPath(unconfirmed)
	queryParams := url.Values{}
	queryParams.Set(queryKey, aleoTrue)
	u.RawQuery = queryParams.Encode()

	buf := bytes.NewBuffer(data)

	req := &http.Request{
		URL:  u,
		Body: io.NopCloser(buf),
	}

	ctx, cncl := context.WithTimeout(ctx, time.Minute)
	defer cncl()

	req = req.WithContext(ctx)

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
		queryParams.Set(limit, limitSize)
		u.RawQuery = queryParams.Encode()

		ctx, cncl := context.WithTimeout(ctx, time.Minute)
		req, _ := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)

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

		if err != nil {
			continue
		}

		shouldRefetch = len(missedPackets) == limitSizeInt
		if !shouldRefetch {
			nextAddressIndex = (nextAddressIndex + 1) % len(c.walletAddresses)
		}

		if shouldRefetch {
			lastInd := len(missedPackets) - 1
			missedPackets[lastInd].IsLast = true
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
