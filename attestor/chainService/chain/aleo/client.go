package aleo

import (
	"context"
	"strings"
	"time"

	"github.com/venture23-aleo/attestor/chainService/chain"
	aleoRpc "github.com/venture23-aleo/attestor/chainService/chain/aleo/rpc"
	"github.com/venture23-aleo/attestor/chainService/config"
)

const (
	defaultWaitDur = time.Hour * 24
	outPacket      = "out_packets"
	aleo           = "aleo"
)

type Client struct {
	aleoClient aleoRpc.IAleoRPC
	name       string
	programID  string
	queryUrl   string
	network    string
	chainID    uint32
	waitDur    time.Duration
	startFrom  uint32
}

type aleoPacket struct {
	version     string
	source      aleoPacketNetworkAddress
	sequence    string
	destination aleoPacketNetworkAddress
	message     aleoMessage
	height      string
}

type aleoPacketNetworkAddress struct {
	chainID string
	address string
}

type aleoMessage struct {
	token    string
	receiver string
	amount   string
	sender   string
}

func (cl *Client) GetPktWithSeq(ctx context.Context, dst uint32, seqNum uint64) (*chain.Packet, error) {
	mappingKey := constructOutMappingKey(dst, seqNum)
	message, err := cl.aleoClient.GetMappingValue(ctx, cl.programID, outPacket, mappingKey)
	if err != nil {
		return nil, err
	}

	pktStr, err := parseMessage(message[mappingKey])
	if err != nil {
		return nil, err
	}
	return parseAleoPacket(pktStr)
}

func (cl *Client) CurHeight(ctx context.Context) uint64 {
	height, err := cl.aleoClient.GetLatestHeight(ctx)
	if err != nil {
		return 0
	}
	return uint64(height)
}

func (cl *Client) getDestChains() ([]string, error) {
	return []string{"ethereum"}, nil
}

func (cl *Client) Name() string {
	return cl.name
}

func (cl *Client) GetChainID() uint32 {
	return cl.chainID
}

func NewClient(cfg *config.ChainConfig) chain.IClient {
	/*
		Initialize aleo client and panic if any error occurs.
	*/
	urlSlice := strings.Split(cfg.NodeUrl, "|")
	if len(urlSlice) != 2 {
		panic("invalid format. Expected format:  <rpc_endpoint>|<network>:: example: http://localhost:3030|testnet3")
	}

	aleoClient, err := aleoRpc.NewRPC(urlSlice[0], urlSlice[1])
	if err != nil {
		panic("failed to create aleoclient")
	}

	name := cfg.Name
	if name == "" {
		name = aleo
	}

	waitDur := cfg.WaitDuration
	if waitDur == 0 {
		waitDur = defaultWaitDur
	}

	return &Client{
		queryUrl:   urlSlice[0],
		network:    urlSlice[1],
		aleoClient: aleoClient,
		waitDur:    waitDur,
		chainID:    cfg.ChainID,
		programID:  cfg.BridgeContract,
		name:       name,
	}
}

func (cl *Client) FeedPacket(ctx context.Context, ch chan<- *chain.Packet) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

	}

}

/*

version+source.chain_id+source.address+sequence

"version":version+ "source":

type SignaturePacket struct{
	hash string
	isWhite string
}

bhp256(hash:respective_hash,isWhite:isWhite) -->
*/

/*
ethereum hash:
bytes32 prefixedHash = keccak256(
	abi.encodePacked(
		"\x19Ethereum Signed Message:\n32", // check if it is provided by abi package
		packetHash,
		tryVote
	)
	);

	tryVote=1 for Yes, 2 for No

*/

/*

function hash(PacketLibrary.InPacket memory packet) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            packet.version,
            packet.sequence,
            packet.sourceTokenService.chainId,
            packet.sourceTokenService.addr,
            packet.destTokenService.chainId,
            packet.destTokenService.addr,
            packet.message.senderAddress,
            packet.message.destTokenAddress,
                packet.message.amount,
                packet.message.receiverAddress,
            packet.height)
        );
    }

*/
