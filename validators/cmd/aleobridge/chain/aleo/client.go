package aleo

import (
	"context"
	"fmt"
	"math/big"
	"os/exec"
	"strconv"
	"strings"
	"time"

	ethCommon "github.com/ethereum/go-ethereum/common"
	aleoRpc "github.com/parajuliswopnil/aleo-go-sdk/rpc"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/chain"
	"github.com/venture23-aleo/aleo-bridge/validators/cmd/aleobridge/relay"
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

const (
	DefaultFinalizingHeight = 1
	BlockGenerationTime     = time.Second * 5
	OUT_PACKET              = "out_packets"
	PRIORITY_FEE            = "1000"
)

type source struct {
	sourceName    string
	sourceAddress string
}

type Client struct {
	src               *source
	url, network      string
	aleoClient        *aleoRpc.Client
	finalizeHeight    uint64
	chainID           uint32
	blockGenTime      time.Duration
	minRequiredGasFee uint64
	chainCfg          *relay.ChainConfig
	wallet            common.Wallet
}

type AleoPacket struct {
	Version     string                   `json:"version"`
	Source      AleoPacketNetworkAddress `json:"source"`
	Sequence    string                   `json:"sequence_no"`
	Destination AleoPacketNetworkAddress `json:"destination"`
	Message     AleoMessage              `json:"msg"`
	Height      string                   `json:""`
}

type AleoPacketNetworkAddress struct {
	Chain_id        string `json:"chain_id"`
	ServiceContract string `json:"service_contract"`
	ServiceProgram  string `json:"service_program"`
}

type AleoMessage struct {
	Denom    string `json:"denom"`
	Receiver string `json:"receiver"`
	Amount   string `json:"amount"`
}

func (cl *Client) GetPktWithSeq(ctx context.Context, dst uint32, seqNum uint64) (*chain.Packet, error) {
	fmt.Println("reached in getting packet wth seq number in aleo")
	seqNumber := strconv.Itoa(int(seqNum)) + "u32"
	var message map[string]string
	var err error
	message, err = nil, nil
	// message, err := cl.aleoClient.GetMappingValue(ctx, dst, OUT_PACKET, seqNumber)
	if err != nil {
		return nil, err
	}

	if message == nil {
		return nil, nil
	}

	packet := parseMessage(message[seqNumber])
	commonPacket := parseAleoPacket(packet)
	return commonPacket, nil
}

func (cl *Client) GetPktsWithSeqAndInSameHeight(ctx context.Context, seqNum uint64) ([]*chain.Packet, error) {
	packets := make([]*chain.Packet, 0)
	return packets, nil
}

func (cl *Client) GetNodeUrlAndNetwork() (string, string) {
	return cl.url, cl.network
}

// SendAttestedPacket sends packet from source chain to target chain
func (cl *Client) SendPacket(ctx context.Context, packet *chain.Packet) error {
	if cl.isAlreadyExist() {
		return chain.AlreadyRelayedPacket{
			CurChainHeight: 0,
		}
	}
	aleoPacket := cl.ConstructAleoPacket(packet)
	query, network := cl.GetNodeUrlAndNetwork()
	privateKey := "" //call common.wallet.skey()
	cmd := exec.CommandContext(context.Background(),
		"snarkos", "developer", "execute", "bridge.aleo", "attest",
		aleoPacket,
		"--private-key", privateKey,
		"--query", query,
		"--broadcast", query+"/"+network+"/transaction/broadcast",
		"--priority-fee", PRIORITY_FEE)

	fmt.Println("calling the contract")
	output, err := cmd.Output()
	if err != nil {
		fmt.Println(err)
		return err
	}
	fmt.Println(string(output))
	return nil
}

func (cl *Client) isAlreadyExist() bool {
	return false
}

func (cl *Client) GetLatestHeight(ctx context.Context) (uint64, error) {
	height, err := cl.aleoClient.GetLatestHeight(ctx)
	if err != nil {
		return 0, err
	}
	return uint64(height), nil
}

func (cl *Client) IsPktTxnFinalized(ctx context.Context, pkt *chain.Packet) (bool, error) {
	return false, nil
}

func (cl *Client) CurHeight() (height uint64) {
	var err error
	if height, err = cl.GetLatestHeight(context.Background()); err != nil {
		return 0
	}
	return
}

func (cl *Client) GetFinalityHeight() uint64 {
	return cl.finalizeHeight
}

func (cl *Client) GetBlockGenTime() time.Duration {
	return cl.blockGenTime
}

func (cl *Client) GetDestChains() ([]string, error) {
	fmt.Println("calling dest chains")
	return []string{"ethereum"}, nil
}

func (cl *Client) GetChainEvent(ctx context.Context) (*chain.ChainEvent, error) {
	return nil, nil
}

func (cl *Client) GetMinReqBalForMakingTxn() uint64 {
	return cl.minRequiredGasFee
}

func (cl *Client) GetWalletBalance(ctx context.Context) (uint64, error) {
	return 0, nil
}

func (cl *Client) Name() string {
	return "Aleo"
}

func (cl *Client) GetSourceChain() (name, address string) {
	name, address = cl.src.sourceName, cl.src.sourceAddress
	return
}

func (cl *Client) GetChainID() uint32 {
	return cl.chainID
}

func Wallet(path string) (common.Wallet, error) {
	wallet, err := relay.LoadWalletConfig(path)
	if err != nil {
		return nil, err
	}
	return wallet, nil
}

func NewClient(cfg *relay.ChainConfig) relay.IClient {
	/*
		Initialize aleo client and panic if any error occurs.
	*/
	url := strings.Split(cfg.NodeUrl, "|")
	if len(url) != 2 {
		panic("wrong newtork url for aleo. format url as:  <rpc_endpoint>|<network>:: example: http://localhost:3030|testnet3")
	}

	aleoClient, err := aleoRpc.NewClient(url[0], url[1])
	if err != nil {
		return nil
	}

	wallet, err := Wallet(cfg.WalletPath)
	if err != nil {
		return nil
	}

	return &Client{
		src: &source{
			sourceName:    cfg.Name,
			sourceAddress: cfg.BridgeContract,
		},
		url:            url[0],
		network:        url[1],
		aleoClient:     aleoClient,
		finalizeHeight: DefaultFinalizingHeight,
		chainID:        cfg.ChainID,
		blockGenTime:   BlockGenerationTime,
		chainCfg:       cfg,
		wallet:         wallet,
	}
}

func parseMessage(m string) *AleoPacket {
	message := trim(m)
	// fmt.Println(message)

	splittedMessage := strings.Split(message, " ")

	msg := []string{}
	pkt := AleoPacket{}

	for i := 0; i < len(splittedMessage); i++ {
		if splittedMessage[i] == "" {
			continue
		}
		msg = append(msg, splittedMessage[i])
	}
	for m, v := range msg {
		switch v {
		case "version:":
			pkt.Version = msg[m+1]
			// fmt.Println(pkt.Version)
		case "sequence_no:":
			pkt.Sequence = msg[m+1]
			// fmt.Println(pkt.Sequence)
		case "source:":
			pkt.Source.Chain_id = msg[m+3]
			// fmt.Println(pkt.Source.Chain_id)
			pkt.Source.ServiceContract = msg[m+5]
			// fmt.Println(pkt.Source.ServiceContract)
		case "destination:":
			serviceProgram := ""
			pkt.Destination.Chain_id = msg[m+3]
			// fmt.Println(pkt.Destination.Chain_id)
			for i := m + 6; true; i++ {
				if msg[i] == "]" {
					break
				}
				serviceProgram += msg[m+6] + " "
			}
			pkt.Destination.ServiceContract = serviceProgram
			// fmt.Println(serviceProgram)
		case "msg:":
			denom := ""
			i := 0
			for i = m + 4; true; i++ {
				if msg[i] == "]" {
					break
				}
				denom += msg[i] + " "
			}
			pkt.Message.Denom = denom
			// fmt.Println(pkt.Message.Denom)
			receiver := ""
			for i = i + 3; true; i++ {
				if msg[i] == "]" {
					break
				}
				receiver += msg[i] + " "
			}
			pkt.Message.Receiver = receiver
			// fmt.Println(pkt.Message.Receiver)
			pkt.Message.Amount = msg[i+2]
			// fmt.Println(pkt.Message.Amount)
		case "height:":
			pkt.Height = strings.Trim(msg[m+1], "}")
			// fmt.Println(pkt.Height)
		}

	}
	return &pkt
}

func trim(msg string) string {
	str := strings.ReplaceAll(msg, "\\n", "")
	return strings.ReplaceAll(str, ",", "")
}

func parseAleoPacket(packet *AleoPacket) (commonPacket *chain.Packet) {
	commonPacket = &chain.Packet{Source: &chain.NetworkAddress{}, Destination: &chain.NetworkAddress{}, Message: &chain.Message{}}
	version, err := strconv.ParseUint(strings.ReplaceAll(packet.Version, "u8", ""), 0, 64)
	if err != nil {
		return nil
	}
	commonPacket.Version = version
	sequence, _ := strconv.ParseUint(strings.ReplaceAll(packet.Sequence, "u32", ""), 0, 64)
	commonPacket.Sequence = sequence

	sourceChainID, _ := strconv.ParseUint(strings.ReplaceAll(packet.Source.Chain_id, "u32", ""), 0, 64)
	commonPacket.Source.ChainID = sourceChainID

	commonPacket.Source.Address = packet.Source.ServiceContract

	destChainID, _ := strconv.ParseUint(strings.ReplaceAll(packet.Destination.Chain_id, "u32", ""), 0, 64)
	commonPacket.Destination.ChainID = destChainID

	commonPacket.Destination.Address = ParseEthAddress(packet.Destination.ServiceContract)

	commonPacket.Message.DestTokenAddress = ParseEthAddress(packet.Message.Denom)
	commonPacket.Message.ReceiverAddress = ParseEthAddress(packet.Message.Receiver)

	amount := &big.Int{}
	commonPacket.Message.Amount, _ = amount.SetString(strings.ReplaceAll(packet.Message.Amount, "u64", ""), 0)

	height, err := strconv.ParseUint(strings.ReplaceAll(packet.Height, "u32", ""), 0, 64)
	if err != nil {
		return
	}
	commonPacket.Height = height

	return
}

func (c *Client) ConstructAleoPacket(msg *chain.Packet) string {
	version := strconv.Itoa(int(msg.Version)) + "u8"
	sequenceNo := strconv.Itoa(int(msg.Sequence)) + "u32"
	srcChainId, srcServiceContract := strconv.Itoa(int(msg.Source.ChainID))+"u32", msg.Source.Address
	dstChainId, dstserviceContract := strconv.Itoa(int(msg.Destination.ChainID))+"u32", msg.Destination.Address
	fmt.Println(srcServiceContract, dstserviceContract)
	denom := msg.Message.DestTokenAddress
	receiver := msg.Message.ReceiverAddress
	amount := msg.Message.Amount.String() + "u64"
	height := strconv.FormatUint(msg.Height, 0) + "u32"
	// todo: fmt.Sprintf()
	constructedPacket := "{ version: " + version + ", sequence_no: " + sequenceNo + ", source: { chain_id: " + srcChainId + ", service_contract: " + ConstructServiceContractAddress(srcServiceContract) + " }, destination: { chain_id: " + dstChainId + ", service_program: " + dstserviceContract + " }, msg: { denom: " + denom + ", receiver: " + receiver + ", amount: " + amount + " }" + ", height: " + height + " }"

	return constructedPacket
}

func ConstructServiceContractAddress(serviceContract string) string {
	aleoAddress := "[ "
	serviceContractByte := []byte(serviceContract)
	lenDifference := 32 - len(serviceContractByte)
	for i := 0; i < lenDifference; i++ { // left pad the return by 0 if the len of byte array of address is smaller than 32
		aleoAddress += "0u8, "
	}

	for i := lenDifference; i < 32; i++ {
		if i != 31 {
			aleoAddress += strconv.Itoa(int(serviceContractByte[i-lenDifference])) + "u8, "
		} else {
			aleoAddress += strconv.Itoa(int(serviceContractByte[i-lenDifference])) + "u8 "
		}
	}
	aleoAddress += "]"
	return aleoAddress
}

func ParseEthAddress(addr string) string {
	addr = strings.ReplaceAll(addr, "u8", "")
	fmt.Println(addr)
	addr = strings.Trim(addr, " ")
	splittedAddress := strings.Split(addr, " ")
	fmt.Println(len(splittedAddress))

	var addrbt []byte

	for i := 12; i < len(splittedAddress)-1; i++ {
		bt, _ := strconv.ParseUint(splittedAddress[i], 0, 8)

		addrbt = append(addrbt, uint8(bt))
	}

	return ethCommon.Bytes2Hex(addrbt)

}
