package rpc

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	defaultReadTimeout = 5 * time.Second
	GET                = "GET"
)

type Client struct {
	url string
}

func NewClient(RpcEndPoint, Network string) (*Client, error) {
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

func (c *Client) GetLatestHash(ctx context.Context) (string, error) {
	latestHash := "/latest/hash"
	requestUrl := c.url + latestHash

	response, err := getHttpResponse(ctx, GET, requestUrl)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()

	ht, err := io.ReadAll(response.Body)
	if err != nil {
		return "", err
	}
	return string(ht), err
}

func (c *Client) GetLatestBlock(ctx context.Context) (*Block, error) {
	latestBlock := "/latest/block"
	requestUrl := c.url + latestBlock

	response, err := getHttpResponse(ctx, GET, requestUrl)
	if err != nil {
		return nil, err
	}
	bl, err := io.ReadAll(response.Body)

	if err != nil {
		return nil, err
	}
	block := &Block{}

	err = json.Unmarshal(bl, block)
	if err != nil {
		return nil, err
	}
	return block, nil
}

func (c *Client) GetLatestRootState(ctx context.Context) (string, error) {
	latestRootState := "/latest/stateRoot"
	requestUrl := c.url + latestRootState

	response, err := getHttpResponse(ctx, GET, requestUrl)
	if err != nil {
		return "", err
	}
	defer response.Body.Close()

	rs, err := io.ReadAll(response.Body)
	if err != nil {
		return "", err
	}

	rootState := string(rs)
	lengthOfRootState := len(rootState)

	if string(rootState[0]) == "\"" && string(rootState[lengthOfRootState-1]) == "\"" {
		rootState = rootState[1 : lengthOfRootState-1]
	}
	return rootState, err
}

// get block by hash or height
func (c *Client) GetBlock(ctx context.Context, id string) (*Block, error) {
	blockEndpoint := "/block/" + id
	requestUrl := c.url + blockEndpoint

	response, err := getHttpResponse(ctx, GET, requestUrl)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	bl, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	block := &Block{}
	err = json.Unmarshal(bl, block)
	if err != nil {
		return nil, err
	}
	return block, nil
}

// gets block height of a given blocks hash
func (c *Client) GetHeightByHash(ctx context.Context, hash string) (int64, error) {
	rpcEndpoint := "/height/" + hash
	requestUrl := c.url + rpcEndpoint

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
	return height, nil
}

// gets the blocks transactions
func (c *Client) GetBlocksTransactions(ctx context.Context, height int64) ([]Transactions, error) {
	block, err := c.GetBlock(ctx, strconv.Itoa(int(height)))
	if err != nil {
		return nil, err
	}
	return block.Transactions, nil
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

// func (c *Client) GetMemoryPoolTransactions() ([]types.Transactions, error) {
// 	rpcEndpoint := "/memoryPool/transactions"
// 	requestUrl := c.url + rpcEndpoint

// 	response, err := http.Get(requestUrl)
// 	if err != nil {
// 		return nil, err
// 	}
// 	t, err := io.ReadAll(response.Body)

// 	if err != nil {
// 		return nil, err
// 	}
// 	transaction := &types.Transaction{}

// 	err = json.Unmarshal(t, transaction)
// 	return transaction, err
// }

// returns the abi of the aleo program and saves the abi to the desired path
func (c *Client) GetProgram(ctx context.Context, programId, path string) error {
	rpcEndpoint := "/program/" + programId
	requestUrl := c.url + rpcEndpoint

	response, err := getHttpResponse(ctx, GET, requestUrl)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	pr, err := io.ReadAll(response.Body)
	if err != nil {
		return err
	}

	program := string(pr)
	lengthOfRootState := len(program)

	if string(program[0]) == "\"" && string(program[lengthOfRootState-1]) == "\"" {
		program = program[1 : lengthOfRootState-1]
	}

	programIntermidiate := strings.Split(program, "\\n")

	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	for _, line := range programIntermidiate {
		_, err := file.WriteString(line + "\n")
		if err != nil {
			return err
		}
	}

	return nil
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

	fmt.Println(mapping)
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

// Returns the state path for the given commitment. The state path proves existence of the transition leaf to either a global or local state root.
func (c *Client) GetStatePathForCommitment(ctx context.Context, commitment string) {}

// returns the list of current beacon node addresses
func (c *Client) GetBeacons(ctx context.Context) ([]string, error) {
	rpcEndpoint := "/beacons"
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

	var beacons []string
	err = json.Unmarshal(t, &beacons)
	if err != nil {
		return nil, err
	}
	return beacons, nil
}

func (c *Client) GetPeersCount(ctx context.Context) (int, error) {
	rpcEndpoint := "/peers/count"
	requestUrl := c.url + rpcEndpoint

	response, err := getHttpResponse(ctx, GET, requestUrl)
	if err != nil {
		return 0, err
	}
	defer response.Body.Close()
	t, err := io.ReadAll(response.Body)

	if err != nil {
		return 0, err
	}

	count, err := strconv.Atoi(string(t))
	if err != nil {
		return 0, err
	}

	return count, nil
}

// Returns the peers connected to the node.
func (c *Client) GetAllPeers(ctx context.Context) ([]string, error) {
	rpcEndpoint := "/peers/all"
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

	var peers []string
	err = json.Unmarshal(t, &peers)
	if err != nil {
		return nil, err
	}
	return peers, nil
}

func (c *Client) GetNodeAddress(ctx context.Context) (string, error) {
	rpcEndpoint := "/node/address"
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

	return string(t), nil
}

// returns the block hash related to the transaction id
func (c *Client) GetBlockHashByTransactionId(ctx context.Context, transactionId string) (string, error) {
	rpcEndpoint := "/find/blockHash/" + transactionId
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

	hash := string(t)
	lengthOfRootState := len(hash)

	if string(hash[0]) == "\"" && string(hash[lengthOfRootState-1]) == "\"" {
		hash = hash[1 : lengthOfRootState-1]
	}
	return hash, err
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

// return transaction id related to the transition id
func (c *Client) FindTransactionIDByTransitionID(ctx context.Context, transitionId string) (string, error) {
	rpcEndpoint := "/find/transactionID/" + transitionId
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

func (c *Client) FindTransitionIDByInputOrOutputID(ctx context.Context, ioId string) (string, error) {
	rpcEndpoint := "/find/transitionID/" + ioId
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

	transitionId := string(t)
	lengthOfRootState := len(transitionId)

	if string(transitionId[0]) == "\"" && string(transitionId[lengthOfRootState-1]) == "\"" {
		transitionId = transitionId[1 : lengthOfRootState-1]
	}
	return transitionId, err
}
