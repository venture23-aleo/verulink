package signer

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
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/config"
)

type SignI interface {
	SignScreenedPacket(ctx context.Context, sp *chain.ScreenedPacket) (string, error)
}

var s SignI

type signService struct {
	url string
}

func (s *signService) SignScreenedPacket(
	ctx context.Context, sp *chain.ScreenedPacket) (signature string, err error) {

	var data []byte
	data, err = json.Marshal(sp)
	if err != nil {
		return
	}

	r := bytes.NewBuffer(data)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.url, r)
	if err != nil {
		return
	}

	resp, err := http.DefaultClient.Do(req)
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
	return string(data), nil
}

func SetupSigner(cfg *config.SigningServiceConfig) error {
	u := &url.URL{
		Host:   fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Path:   cfg.Endpoint,
		Scheme: cfg.Scheme,
		User:   url.UserPassword(cfg.Username, cfg.Password),
	}

	err := dial(u.String())
	if err != nil {
		return err
	}

	s = &signService{
		url: u.String(),
	}
	return nil
}

func dial(u string) error {

	ctx, cncl := context.WithTimeout(context.TODO(), time.Second*30)
	defer cncl()
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}

	if resp.StatusCode < 400 || resp.StatusCode > 499 {
		return fmt.Errorf("expected status code 4xx, got %d", resp.StatusCode)
	}

	return nil
}

func GetSigner() SignI {
	return s
}
