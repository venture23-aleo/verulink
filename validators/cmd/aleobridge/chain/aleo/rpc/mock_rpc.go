package rpc

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"os/exec"
	"strconv"
)

type MockClient struct {
	url string
}

func NewMockRPC(RpcEndPoint, Network string) (*MockClient, error) {
	client := &MockClient{
		url: RpcEndPoint + "/" + Network,
	}
	return client, nil
}

func (c *MockClient) GetLatestHeight(ctx context.Context) (int64, error) {
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

func (c *MockClient) GetTransactionById(ctx context.Context, transactionId string) (*Transaction, error) {
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

func (c *MockClient) GetMappingNames(ctx context.Context, programId string) ([]string, error) {
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

func giveOutPackets(key string, seqNum uint64) map[string]string {
	packetString := "{\\n  version: 0u8,\\n  sequence: " + strconv.Itoa(int(seqNum)) + "u32,\\n  source: {\\n    chain_id: 2u32,\\n    addr: aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px\\n  },\\n  destination: {\\n    chain_id: 1u32,\\n    addr: [\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      20u8,\\n      119u8,\\n      159u8,\\n      153u8,\\n      43u8,\\n      47u8,\\n      44u8,\\n      66u8,\\n      184u8,\\n      102u8,\\n      15u8,\\n      250u8,\\n      66u8,\\n      219u8,\\n      203u8,\\n      60u8,\\n      124u8,\\n      153u8,\\n      48u8,\\n      176u8\\n    ]\\n  },\\n  message: {\\n    token: [\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      20u8,\\n      119u8,\\n      159u8,\\n      153u8,\\n      43u8,\\n      47u8,\\n      44u8,\\n      66u8,\\n      184u8,\\n      102u8,\\n      15u8,\\n      250u8,\\n      66u8,\\n      219u8,\\n      203u8,\\n      60u8,\\n      124u8,\\n      153u8,\\n      48u8,\\n      176u8\\n    ],\\n    sender: aleo18z337vpafgfgmpvd4dgevel6la75r8eumcmuyafp6aa4nnkqmvrsht2skn,\\n    receiver: [\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8,\\n      0u8\\n    ],\\n    amount: 102u64\\n  },\\n  height: 55u32\\n}"
	return map[string]string{key: packetString}

}

// returns the value in a key-value mapping corresponding to the supplied mappingKey
func (c *MockClient) GetMappingValue(ctx context.Context, programId, mappingName, mappingKey string) (map[string]string, error) {
	if mappingKey == "{chain_id:1u32,sequence:1u32}" {
		return giveOutPackets("{chain_id:1u32,sequence:1u32}", 1), nil
	} else if mappingKey == "{chain_id:1u32,sequence:3u32}" {
		return giveOutPackets("{chain_id:1u32,sequence:3u32}", 3), nil
	}
	return nil, errors.New("empty packet")
}

// returns transaction id related to the program id
func (c *MockClient) FindTransactionIDByProgramID(ctx context.Context, programId string) (string, error) {
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

func (c *MockClient) Send(_ctx context.Context, aleoPacket, privateKey, queryUrl, network, priorityFee string) *exec.Cmd {
	if network == "happynetwork" {
		cmd := exec.CommandContext(_ctx, "sleep", "1")
		return cmd
	} else if (network == "timeout") {
		cmd := exec.CommandContext(_ctx, "sleep", "30")
		return cmd
	} else if network == "invalidparam" {
		cmd := exec.CommandContext(_ctx, "sleep", "5op")
		return cmd
	} else {
		cmd := exec.CommandContext(_ctx, "snarkoss", "5")
		return cmd
	}
}
