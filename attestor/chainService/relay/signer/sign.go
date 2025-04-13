package signer

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/venture23-aleo/verulink/attestor/chainService/chain"
	"github.com/venture23-aleo/verulink/attestor/chainService/config"
	"github.com/venture23-aleo/verulink/attestor/chainService/logger"
	"go.uber.org/zap"
)

// response body fields
const (
	signatureField = "signature"
	hashField      = "hash"
)

type SignI interface {
	HashAndSignScreenedPacket(
		ctx context.Context, sp *chain.ScreenedPacket) (hash string, signature string, err error)

	CheckSigningServiceHealth(ctx context.Context, cfg *config.SigningServiceConfig) error
}

var s SignI

type signService struct {
	url          string
	signerClient *http.Client
}

// HashAndSignScreendedPacket calls the signing service to hash and sign the screened packets
func (s *signService) HashAndSignScreenedPacket(
	ctx context.Context, sp *chain.ScreenedPacket) (hash, signature string, err error) {

	var data []byte
	data, err = json.Marshal(sp)
	if err != nil {
		return
	}

	r := bytes.NewBuffer(data)
	ctx, cncl := context.WithTimeout(ctx, time.Second*30)
	defer cncl()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.url, r)
	if err != nil {
		return
	}

	resp, err := s.signerClient.Do(req)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		err = fmt.Errorf("expected status code %d, got %d", http.StatusOK, resp.StatusCode)
		return
	}
	data, err = io.ReadAll(resp.Body)
	if err != nil {
		return
	}
	m := make(map[string]string)
	err = json.Unmarshal(data, &m)
	if err != nil {
		return
	}

	var ok bool
	hash, ok = m[hashField]
	if !ok {
		err = errors.New("missing hash field")
	}
	signature, ok = m[signatureField]
	if !ok {
		err = errors.New("missing signature field")
	}

	return
}

func (s *signService) CheckSigningServiceHealth(ctx context.Context, cfg *config.SigningServiceConfig) error {

	u := &url.URL{
		Host:   fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Path:   cfg.HealthEndpoint,
		Scheme: cfg.Scheme,
	}

	ctx, cncl := context.WithTimeout(ctx, time.Second*30)
	defer cncl()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return err
	}

	resp, err := s.signerClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("expected status code 200, got status code %d", resp.StatusCode)
	}
	return nil
}

// SetupSigner checks if url can be dialed and sets up given parameters for chainservice to
// communicate with signing service securely.
func SetupSigner(cfg *config.SigningServiceConfig, creds *config.Creds) error {
	logger.GetLogger().Info("Setting up signer",
		zap.String("scheme", cfg.Scheme),
		zap.String("endpoint", cfg.Endpoint),
		zap.String("host", cfg.Host),
	)
	u := &url.URL{
		Host:   fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Path:   cfg.Endpoint,
		Scheme: cfg.Scheme,
		User:   url.UserPassword(creds.Username, creds.Password),
	}

	client := &http.Client{
		Timeout: time.Second * 30,
	}

	err := dial(u.String(), client)
	if err != nil {
		return err
	}

	s = &signService{
		url:          u.String(),
		signerClient: client,
	}
	return nil
}

// dial simply sends post request on sign endpoint.
// without proper request body it should respond with status in 4xx range.
func dial(u string, client *http.Client) error {

	ctx, cncl := context.WithTimeout(context.TODO(), time.Second*30)
	defer cncl()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, nil)
	if err != nil {
		return err
	}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 400 || resp.StatusCode > 499 {
		return fmt.Errorf("expected status code 4xx, got %d", resp.StatusCode)
	}

	return nil
}

func GetSigner() SignI {
	return s
}
