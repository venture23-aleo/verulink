package collector

import (
	"bytes"
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/venture23-aleo/verulink/attestor/chainService/chain"
	"github.com/venture23-aleo/verulink/attestor/chainService/common"
	"github.com/venture23-aleo/verulink/attestor/chainService/config"
	"github.com/venture23-aleo/verulink/attestor/chainService/logger"
)

const (
	signatureEndPoint = "signature"
	aleoTrue          = "true"
)

// headers
const (
	contentType = "application/json"
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

// CollectorI represents the interface for a signature collector i.e. db-service and hence the name collectorI.
type CollectorI interface {
	// SendToCollector sends screened-packet hash, signature and few other meta data required by the
	// db-service.
	SendToCollector(ctx context.Context, sp *chain.ScreenedPacket, pktHash, sig string) error
	// ReceivePktsFromCollector regularly polls db-service if there are any packets that attestors need to
	// resend signature. This feature in db-service will become handy especially when db-service is corrupted
	// and new db-service is started.
	// Note that, db-service will delete missed-packet entry from its collection only when attestor sends valid
	// signature.
	ReceivePktsFromCollector(ctx context.Context, ch chan<- *chain.MissedPacket)

	CheckCollectorHealth(ctx context.Context) error
}

var collc collector

type collector struct {
	uri              string
	chainIDToAddress map[string]string // chainID: walletAddress
	collectorWaitDur time.Duration
	collectorClient  *http.Client
}

func (c *collector) CheckCollectorHealth(ctx context.Context) error {

	ctx, cncl := context.WithTimeout(ctx, time.Minute)
	defer cncl()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.uri, nil)
	if err != nil {
		return err
	}

	resp, err := c.collectorClient.Do(req)
	if err != nil {
		logger.GetLogger().Error(err.Error())
		return err
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("expected status code %d, got %d", http.StatusCreated, resp.StatusCode)
	}

	defer resp.Body.Close()
	return nil
}

func (c *collector) SendToCollector(ctx context.Context, sp *chain.ScreenedPacket, pktHash, sig string) error {
	// Construct parameters for the request
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

	req.Header.Set("content-type", contentType)
	resp, err := c.collectorClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	r, _ := io.ReadAll(resp.Body)
	if resp.StatusCode == http.StatusCreated {
		var response chain.CollectorResponse

		if err := json.Unmarshal(r, &response); err != nil {
			return err
		}
		if response.Message == "Duplicate packet" {
			return common.AlreadyRelayedPacket{}
		}
		return nil
	}

	return fmt.Errorf("expected status code %d, got %d, response: %s", http.StatusCreated, resp.StatusCode, string(r))
}

// ReceivePktsFromCollector regularly queries db-service if there are any packets that attestor has to
// resign. For each chain, attestor will have different wallet address. Db-service assigns missed-packets
// to the respective wallet address, so that attestor should also request missed-packets assigned for each
// wallet-address.
// The wallet-address in the request parameter belongs to the source chain i.e. db-service will return packets
// of which attestor's wallet-address is registered in source chain.
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
			missedPackets   *chain.MissedPacketDetails
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

		resp, err = c.collectorClient.Do(req)
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

		for _, m := range missedPackets.Data {
			ch <- m
		}
		// Update index for next wallet address
		nextAddressIndex = (nextAddressIndex + 1) % len(walletAddresses)
	}
}

func GetCollector() CollectorI {
	return &collc
}

func SetupCollector(cfg config.CollecterServiceConfig, chainIDToAddress map[string]string, waitTime time.Duration) error {
	caCert, err := os.ReadFile(cfg.CaCertificate)
	if err != nil {
		return err
	}

	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)

	attestorCert, err := tls.LoadX509KeyPair(cfg.AttestorCertificate, cfg.AttestorKey)
	if err != nil {
		log.Fatal(err)
	}
	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				RootCAs:      caCertPool,
				Certificates: []tls.Certificate{attestorCert},
			},
		},
	}
	collc = collector{
		uri:              cfg.Uri,
		collectorWaitDur: waitTime,
		chainIDToAddress: make(map[string]string),
		collectorClient:  client,
	}

	for k, v := range chainIDToAddress {
		collc.chainIDToAddress[k] = v
	}

	return nil
}
