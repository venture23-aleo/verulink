package dbservice

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

var collectorUri string

func NewDataBase(uri string) {
	collectorUri = uri
}

type PacketInfo struct {
	ID            string `json:"_id"`
	SourceChainID string `json:"sourceChainId"`
	DestChainID   string `json:"destChainId"`
	Sequence      uint64 `json:"sequence"`
	PacketHash    string `json:"packetHash"`
	Attestor      string `json:"attestorSigner"`
	Signature     string `json:"signature"`
	Screening     string `json:"offChainAnalysis"`
}

func GetPacketInfo(ctx context.Context, sequence, source, dest string) (*PacketInfo, error) {
	u, _ := url.Parse(collectorUri)
	u.JoinPath("signature")
	queryParams := url.Values{}
	queryParams.Set("sequence", sequence)
	queryParams.Set("sourceChainId", source)
	queryParams.Set("destChainId", dest)

	u.RawQuery = queryParams.Encode()

	ctx, cncl := context.WithTimeout(ctx, time.Minute)
	defer cncl()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		err = fmt.Errorf("unexpected status code %d", resp.StatusCode)
		return nil, err
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	pktInfo := new(PacketInfo)
	err = json.Unmarshal(data, pktInfo)
	if err != nil {
		return nil, err
	}

	return pktInfo, err
}
