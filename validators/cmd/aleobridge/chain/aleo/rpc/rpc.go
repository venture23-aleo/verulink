package rpc

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os/exec"
	"strconv"
	"time"
)

const (
	defaultReadTimeout = 5 * time.Second
	GET                = "GET"
)

type IAleoRPC interface {
	FindTransactionIDByProgramID(ctx context.Context, programId string) (string, error)
	GetMappingValue(ctx context.Context, programId, mappingName, mappingKey string) (map[string]string, error)
	GetMappingNames(ctx context.Context, programId string) ([]string, error)
	GetTransactionById(ctx context.Context, transactionId string) (*Transaction, error)
	GetLatestHeight(ctx context.Context) (int64, error)
	Send(ctx context.Context, aleoPacket, privateKey, queryUrl, network, priorityFee string) *exec.Cmd
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

func (c *Client) GetTransactionById(ctx context.Context, transactionId string) (*Transaction, error) {
	rpcEndpoint := "/transaction/" + transactionId
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

	transaction := &Transaction{}
	err = json.Unmarshal(t, transaction)
	if err != nil {
		return nil, err
	}
	return transaction, nil
}

func (c *Client) GetMappingNames(ctx context.Context, programId string) ([]string, error) {
	var mapping []string
	rpcEndpoint := "/program/" + programId + "/mappings"
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

	err = json.Unmarshal(t, &mapping)
	if err != nil {
		return nil, err
	}

	return mapping, nil
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

// returns transaction id related to the program id
func (c *Client) FindTransactionIDByProgramID(ctx context.Context, programId string) (string, error) {
	rpcEndpoint := "/find/transactionID/deployment/" + programId
	requestUrl := c.url + rpcEndpoint

	response, err := getHttpResponse(ctx, GET, requestUrl)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()

	t, err := io.ReadAll(response.Body)

	if err != nil {
		return "", err
	}

	transactionId := string(t)
	lengthOfRootState := len(transactionId)

	if string(transactionId[0]) == "\"" && string(transactionId[lengthOfRootState-1]) == "\"" {
		transactionId = transactionId[1 : lengthOfRootState-1]
	}
	return transactionId, err
}

func (c *Client) Send(ctx context.Context, aleoPacket, privateKey, queryUrl, network, priorityFee string) *exec.Cmd {
	return exec.CommandContext(ctx,
		"snarkos", "developer", "execute", "bridge.aleo", "attest",
		aleoPacket,
		"--private-key", privateKey,
		"--query", queryUrl,
		"--broadcast", queryUrl+"/"+network+"/transaction/broadcast",
		"--priority-fee", priorityFee)
}
