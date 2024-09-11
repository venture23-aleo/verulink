package rpc

import (
	"context"
	"io"
	"net/http"
	"strconv"
	"time"
)

const (
	defaultReadTimeout = 5 * time.Second
	GET                = "GET"
)

type IAleoRPC interface {
	GetMappingValue(ctx context.Context, programId, mappingName, mappingKey string) (map[string]string, error)
	GetLatestHeight(ctx context.Context) (int64, error)
}

type Client struct {
	url string
}

func NewRPC(RpcEndPoint, Network string) (IAleoRPC, error) {
	client := &Client{
		url: RpcEndPoint + "/" + Network,
	}
	return client, nil
}

func getHttpResponse(ctx context.Context, method, requestURL string) (*http.Response, error) {
	req, err := http.NewRequest(method, requestURL, nil)
	if err != nil {
		return nil, err
	}

	req = req.WithContext(ctx)
	response, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	return response, nil
}

func (c *Client) GetLatestHeight(ctx context.Context) (int64, error) {
	latestHeight := "/latest/height"
	requestUrl := c.url + latestHeight

	response, err := getHttpResponse(ctx, GET, requestUrl)
	if err != nil {
		return 0, err
	}
	defer response.Body.Close()

	ht, err := io.ReadAll(response.Body)
	if err != nil {
		return 0, err
	}

	height, err := strconv.ParseInt(string(ht), 10, 64)
	if err != nil {
		return 0, err
	}
	return height, err
}

// returns the value in a key-value mapping corresponding to the supplied mappingKey
func (c *Client) GetMappingValue(ctx context.Context, programId, mappingName, mappingKey string) (map[string]string, error) {
	rpcEndpoint := "/program/" + programId + "/mapping/" + mappingName + "/" + mappingKey
	requestUrl := c.url + rpcEndpoint

	response, err := getHttpResponse(ctx, GET, requestUrl)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	t, err := io.ReadAll(response.Body)

	if err != nil {
		return nil, err
	}

	value := make(map[string]string)

	value[mappingKey] = string(t)

	return value, nil
}
