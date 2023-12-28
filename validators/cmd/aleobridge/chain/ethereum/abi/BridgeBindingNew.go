// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package abi

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
	_ = abi.ConvertType
)

// PacketLibraryInNetworkAddress is an auto generated low-level Go binding around an user-defined struct.
type PacketLibraryInNetworkAddress struct {
	ChainId *big.Int
	Addr    common.Address
}

// PacketLibraryInPacket is an auto generated low-level Go binding around an user-defined struct.
type PacketLibraryInPacket struct {
	Version            *big.Int
	Sequence           *big.Int
	SourceTokenService PacketLibraryOutNetworkAddress
	DestTokenService   PacketLibraryInNetworkAddress
	Message            PacketLibraryInTokenMessage
	Height             *big.Int
}

// PacketLibraryInTokenMessage is an auto generated low-level Go binding around an user-defined struct.
type PacketLibraryInTokenMessage struct {
	SenderAddress    string
	DestTokenAddress common.Address
	Amount           *big.Int
	ReceiverAddress  common.Address
}

// PacketLibraryOutNetworkAddress is an auto generated low-level Go binding around an user-defined struct.
type PacketLibraryOutNetworkAddress struct {
	ChainId *big.Int
	Addr    string
}

// PacketLibraryOutPacket is an auto generated low-level Go binding around an user-defined struct.
type PacketLibraryOutPacket struct {
	Version            *big.Int
	Sequence           *big.Int
	SourceTokenService PacketLibraryInNetworkAddress
	DestTokenService   PacketLibraryOutNetworkAddress
	Message            PacketLibraryOutTokenMessage
	Height             *big.Int
}

// PacketLibraryOutTokenMessage is an auto generated low-level Go binding around an user-defined struct.
type PacketLibraryOutTokenMessage struct {
	SenderAddress    common.Address
	DestTokenAddress string
	Amount           *big.Int
	ReceiverAddress  string
}

// BridgeMetaData contains all meta data concerning the Bridge contract.
var BridgeMetaData = &bind.MetaData{
	ABI: "[{\"inputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"bytes32\",\"name\":\"packetHash\",\"type\":\"bytes32\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"voter\",\"type\":\"address\"}],\"name\":\"AlreadyVoted\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"attestor\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"quorum\",\"type\":\"uint256\"}],\"name\":\"AttestorAdded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"attestor\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"quorum\",\"type\":\"uint256\"}],\"name\":\"AttestorRemoved\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"indexed\":false,\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"chain\",\"type\":\"tuple\"}],\"name\":\"ChainAdded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"}],\"name\":\"ChainRemoved\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"bytes32\",\"name\":\"packetHash\",\"type\":\"bytes32\"}],\"name\":\"Consumed\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint8\",\"name\":\"version\",\"type\":\"uint8\"}],\"name\":\"Initialized\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"version\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"sourceTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InNetworkAddress\",\"name\":\"destTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"string\",\"name\":\"senderAddress\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"destTokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"receiverAddress\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InTokenMessage\",\"name\":\"message\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"height\",\"type\":\"uint256\"}],\"indexed\":false,\"internalType\":\"structPacketLibrary.InPacket\",\"name\":\"packet\",\"type\":\"tuple\"}],\"name\":\"PacketArrived\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"version\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InNetworkAddress\",\"name\":\"sourceTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"destTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"address\",\"name\":\"senderAddress\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"destTokenAddress\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"receiverAddress\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutTokenMessage\",\"name\":\"message\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"height\",\"type\":\"uint256\"}],\"indexed\":false,\"internalType\":\"structPacketLibrary.OutPacket\",\"name\":\"packet\",\"type\":\"tuple\"}],\"name\":\"PacketDispatched\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"tokenService\",\"type\":\"address\"}],\"name\":\"TokenServiceAdded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"tokenService\",\"type\":\"address\"}],\"name\":\"TokenServiceRemoved\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"bytes32\",\"name\":\"packetHash\",\"type\":\"bytes32\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"voter\",\"type\":\"address\"}],\"name\":\"Voted\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"attestor\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"newQuorumRequired\",\"type\":\"uint256\"}],\"name\":\"addAttestor\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"destBridgeAddress\",\"type\":\"string\"}],\"name\":\"addChain\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"tokenService\",\"type\":\"address\"}],\"name\":\"addTokenService\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"chains\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"version\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"sourceTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InNetworkAddress\",\"name\":\"destTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"string\",\"name\":\"senderAddress\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"destTokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"receiverAddress\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InTokenMessage\",\"name\":\"message\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"height\",\"type\":\"uint256\"}],\"internalType\":\"structPacketLibrary.InPacket\",\"name\":\"packet\",\"type\":\"tuple\"}],\"name\":\"consume\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"consumedPackets\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"}],\"name\":\"getIncomingPacketHash\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"packetHash\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"}],\"name\":\"hasQuorumReached\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"packetHash\",\"type\":\"bytes32\"}],\"name\":\"hasQuorumReached\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"voter\",\"type\":\"address\"}],\"name\":\"hasVoted\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes32\",\"name\":\"packetHash\",\"type\":\"bytes32\"},{\"internalType\":\"address\",\"name\":\"voter\",\"type\":\"address\"}],\"name\":\"hasVoted\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"version\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"sourceTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InNetworkAddress\",\"name\":\"destTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"string\",\"name\":\"senderAddress\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"destTokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"receiverAddress\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InTokenMessage\",\"name\":\"message\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"height\",\"type\":\"uint256\"}],\"internalType\":\"structPacketLibrary.InPacket\",\"name\":\"packet\",\"type\":\"tuple\"}],\"name\":\"hash\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"pure\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"incomingPackets\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"}],\"name\":\"initialize\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"attestor\",\"type\":\"address\"}],\"name\":\"isAttestor\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_chainId\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_sequence\",\"type\":\"uint256\"}],\"name\":\"isPacketConsumed\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"tokenService\",\"type\":\"address\"}],\"name\":\"isRegisteredTokenService\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"}],\"name\":\"isSupportedChain\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"outgoingPackets\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"version\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InNetworkAddress\",\"name\":\"sourceTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"destTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"address\",\"name\":\"senderAddress\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"destTokenAddress\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"receiverAddress\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutTokenMessage\",\"name\":\"message\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"height\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"owner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"quorumRequired\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"version\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"sourceTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InNetworkAddress\",\"name\":\"destTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"string\",\"name\":\"senderAddress\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"destTokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"receiverAddress\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InTokenMessage\",\"name\":\"message\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"height\",\"type\":\"uint256\"}],\"internalType\":\"structPacketLibrary.InPacket\",\"name\":\"packet\",\"type\":\"tuple\"}],\"name\":\"receivePacket\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"version\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"sourceTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InNetworkAddress\",\"name\":\"destTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"string\",\"name\":\"senderAddress\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"destTokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"receiverAddress\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InTokenMessage\",\"name\":\"message\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"height\",\"type\":\"uint256\"}],\"internalType\":\"structPacketLibrary.InPacket[]\",\"name\":\"packets\",\"type\":\"tuple[]\"}],\"name\":\"receivePacketBatch\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"attestor\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"newQuorumRequired\",\"type\":\"uint256\"}],\"name\":\"removeAttestor\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"}],\"name\":\"removeChain\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"tokenService\",\"type\":\"address\"}],\"name\":\"removeTokenService\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"version\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InNetworkAddress\",\"name\":\"sourceTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"destTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"address\",\"name\":\"senderAddress\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"destTokenAddress\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"receiverAddress\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutTokenMessage\",\"name\":\"message\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"height\",\"type\":\"uint256\"}],\"internalType\":\"structPacketLibrary.OutPacket\",\"name\":\"packet\",\"type\":\"tuple\"}],\"name\":\"sendMessage\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"sequences\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"transferOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
}

// BridgeABI is the input ABI used to generate the binding from.
// Deprecated: Use BridgeMetaData.ABI instead.
var BridgeABI = BridgeMetaData.ABI

// Bridge is an auto generated Go binding around an Ethereum contract.
type Bridge struct {
	BridgeCaller     // Read-only binding to the contract
	BridgeTransactor // Write-only binding to the contract
	BridgeFilterer   // Log filterer for contract events
}

// BridgeCaller is an auto generated read-only Go binding around an Ethereum contract.
type BridgeCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// BridgeTransactor is an auto generated write-only Go binding around an Ethereum contract.
type BridgeTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// BridgeFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type BridgeFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// BridgeSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type BridgeSession struct {
	Contract     *Bridge           // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// BridgeCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type BridgeCallerSession struct {
	Contract *BridgeCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts // Call options to use throughout this session
}

// BridgeTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type BridgeTransactorSession struct {
	Contract     *BridgeTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// BridgeRaw is an auto generated low-level Go binding around an Ethereum contract.
type BridgeRaw struct {
	Contract *Bridge // Generic contract binding to access the raw methods on
}

// BridgeCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type BridgeCallerRaw struct {
	Contract *BridgeCaller // Generic read-only contract binding to access the raw methods on
}

// BridgeTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type BridgeTransactorRaw struct {
	Contract *BridgeTransactor // Generic write-only contract binding to access the raw methods on
}

// NewBridge creates a new instance of Bridge, bound to a specific deployed contract.
func NewBridge(address common.Address, backend bind.ContractBackend) (*Bridge, error) {
	contract, err := bindBridge(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &Bridge{BridgeCaller: BridgeCaller{contract: contract}, BridgeTransactor: BridgeTransactor{contract: contract}, BridgeFilterer: BridgeFilterer{contract: contract}}, nil
}

// NewBridgeCaller creates a new read-only instance of Bridge, bound to a specific deployed contract.
func NewBridgeCaller(address common.Address, caller bind.ContractCaller) (*BridgeCaller, error) {
	contract, err := bindBridge(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &BridgeCaller{contract: contract}, nil
}

// NewBridgeTransactor creates a new write-only instance of Bridge, bound to a specific deployed contract.
func NewBridgeTransactor(address common.Address, transactor bind.ContractTransactor) (*BridgeTransactor, error) {
	contract, err := bindBridge(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &BridgeTransactor{contract: contract}, nil
}

// NewBridgeFilterer creates a new log filterer instance of Bridge, bound to a specific deployed contract.
func NewBridgeFilterer(address common.Address, filterer bind.ContractFilterer) (*BridgeFilterer, error) {
	contract, err := bindBridge(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &BridgeFilterer{contract: contract}, nil
}

// bindBridge binds a generic wrapper to an already deployed contract.
func bindBridge(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := BridgeMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Bridge *BridgeRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Bridge.Contract.BridgeCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Bridge *BridgeRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Bridge.Contract.BridgeTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Bridge *BridgeRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Bridge.Contract.BridgeTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_Bridge *BridgeCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _Bridge.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_Bridge *BridgeTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Bridge.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_Bridge *BridgeTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _Bridge.Contract.contract.Transact(opts, method, params...)
}

// Chains is a free data retrieval call binding the contract method 0x550325b5.
//
// Solidity: function chains(uint256 ) view returns(uint256 chainId, string addr)
func (_Bridge *BridgeCaller) Chains(opts *bind.CallOpts, arg0 *big.Int) (struct {
	ChainId *big.Int
	Addr    string
}, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "chains", arg0)

	outstruct := new(struct {
		ChainId *big.Int
		Addr    string
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.ChainId = *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)
	outstruct.Addr = *abi.ConvertType(out[1], new(string)).(*string)

	return *outstruct, err

}

// Chains is a free data retrieval call binding the contract method 0x550325b5.
//
// Solidity: function chains(uint256 ) view returns(uint256 chainId, string addr)
func (_Bridge *BridgeSession) Chains(arg0 *big.Int) (struct {
	ChainId *big.Int
	Addr    string
}, error) {
	return _Bridge.Contract.Chains(&_Bridge.CallOpts, arg0)
}

// Chains is a free data retrieval call binding the contract method 0x550325b5.
//
// Solidity: function chains(uint256 ) view returns(uint256 chainId, string addr)
func (_Bridge *BridgeCallerSession) Chains(arg0 *big.Int) (struct {
	ChainId *big.Int
	Addr    string
}, error) {
	return _Bridge.Contract.Chains(&_Bridge.CallOpts, arg0)
}

// ConsumedPackets is a free data retrieval call binding the contract method 0x555e9074.
//
// Solidity: function consumedPackets(uint256 , uint256 ) view returns(bytes32)
func (_Bridge *BridgeCaller) ConsumedPackets(opts *bind.CallOpts, arg0 *big.Int, arg1 *big.Int) ([32]byte, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "consumedPackets", arg0, arg1)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// ConsumedPackets is a free data retrieval call binding the contract method 0x555e9074.
//
// Solidity: function consumedPackets(uint256 , uint256 ) view returns(bytes32)
func (_Bridge *BridgeSession) ConsumedPackets(arg0 *big.Int, arg1 *big.Int) ([32]byte, error) {
	return _Bridge.Contract.ConsumedPackets(&_Bridge.CallOpts, arg0, arg1)
}

// ConsumedPackets is a free data retrieval call binding the contract method 0x555e9074.
//
// Solidity: function consumedPackets(uint256 , uint256 ) view returns(bytes32)
func (_Bridge *BridgeCallerSession) ConsumedPackets(arg0 *big.Int, arg1 *big.Int) ([32]byte, error) {
	return _Bridge.Contract.ConsumedPackets(&_Bridge.CallOpts, arg0, arg1)
}

// GetIncomingPacketHash is a free data retrieval call binding the contract method 0x419eb411.
//
// Solidity: function getIncomingPacketHash(uint256 chainId, uint256 sequence) view returns(bytes32 packetHash)
func (_Bridge *BridgeCaller) GetIncomingPacketHash(opts *bind.CallOpts, chainId *big.Int, sequence *big.Int) ([32]byte, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "getIncomingPacketHash", chainId, sequence)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// GetIncomingPacketHash is a free data retrieval call binding the contract method 0x419eb411.
//
// Solidity: function getIncomingPacketHash(uint256 chainId, uint256 sequence) view returns(bytes32 packetHash)
func (_Bridge *BridgeSession) GetIncomingPacketHash(chainId *big.Int, sequence *big.Int) ([32]byte, error) {
	return _Bridge.Contract.GetIncomingPacketHash(&_Bridge.CallOpts, chainId, sequence)
}

// GetIncomingPacketHash is a free data retrieval call binding the contract method 0x419eb411.
//
// Solidity: function getIncomingPacketHash(uint256 chainId, uint256 sequence) view returns(bytes32 packetHash)
func (_Bridge *BridgeCallerSession) GetIncomingPacketHash(chainId *big.Int, sequence *big.Int) ([32]byte, error) {
	return _Bridge.Contract.GetIncomingPacketHash(&_Bridge.CallOpts, chainId, sequence)
}

// HasQuorumReached is a free data retrieval call binding the contract method 0x314a529e.
//
// Solidity: function hasQuorumReached(uint256 chainId, uint256 sequence) view returns(bool)
func (_Bridge *BridgeCaller) HasQuorumReached(opts *bind.CallOpts, chainId *big.Int, sequence *big.Int) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "hasQuorumReached", chainId, sequence)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// HasQuorumReached is a free data retrieval call binding the contract method 0x314a529e.
//
// Solidity: function hasQuorumReached(uint256 chainId, uint256 sequence) view returns(bool)
func (_Bridge *BridgeSession) HasQuorumReached(chainId *big.Int, sequence *big.Int) (bool, error) {
	return _Bridge.Contract.HasQuorumReached(&_Bridge.CallOpts, chainId, sequence)
}

// HasQuorumReached is a free data retrieval call binding the contract method 0x314a529e.
//
// Solidity: function hasQuorumReached(uint256 chainId, uint256 sequence) view returns(bool)
func (_Bridge *BridgeCallerSession) HasQuorumReached(chainId *big.Int, sequence *big.Int) (bool, error) {
	return _Bridge.Contract.HasQuorumReached(&_Bridge.CallOpts, chainId, sequence)
}

// HasQuorumReached0 is a free data retrieval call binding the contract method 0xc0abe2fe.
//
// Solidity: function hasQuorumReached(bytes32 packetHash) view returns(bool)
func (_Bridge *BridgeCaller) HasQuorumReached0(opts *bind.CallOpts, packetHash [32]byte) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "hasQuorumReached0", packetHash)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// HasQuorumReached0 is a free data retrieval call binding the contract method 0xc0abe2fe.
//
// Solidity: function hasQuorumReached(bytes32 packetHash) view returns(bool)
func (_Bridge *BridgeSession) HasQuorumReached0(packetHash [32]byte) (bool, error) {
	return _Bridge.Contract.HasQuorumReached0(&_Bridge.CallOpts, packetHash)
}

// HasQuorumReached0 is a free data retrieval call binding the contract method 0xc0abe2fe.
//
// Solidity: function hasQuorumReached(bytes32 packetHash) view returns(bool)
func (_Bridge *BridgeCallerSession) HasQuorumReached0(packetHash [32]byte) (bool, error) {
	return _Bridge.Contract.HasQuorumReached0(&_Bridge.CallOpts, packetHash)
}

// HasVoted is a free data retrieval call binding the contract method 0x0d39a1d3.
//
// Solidity: function hasVoted(uint256 chainId, uint256 sequence, address voter) view returns(bool)
func (_Bridge *BridgeCaller) HasVoted(opts *bind.CallOpts, chainId *big.Int, sequence *big.Int, voter common.Address) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "hasVoted", chainId, sequence, voter)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// HasVoted is a free data retrieval call binding the contract method 0x0d39a1d3.
//
// Solidity: function hasVoted(uint256 chainId, uint256 sequence, address voter) view returns(bool)
func (_Bridge *BridgeSession) HasVoted(chainId *big.Int, sequence *big.Int, voter common.Address) (bool, error) {
	return _Bridge.Contract.HasVoted(&_Bridge.CallOpts, chainId, sequence, voter)
}

// HasVoted is a free data retrieval call binding the contract method 0x0d39a1d3.
//
// Solidity: function hasVoted(uint256 chainId, uint256 sequence, address voter) view returns(bool)
func (_Bridge *BridgeCallerSession) HasVoted(chainId *big.Int, sequence *big.Int, voter common.Address) (bool, error) {
	return _Bridge.Contract.HasVoted(&_Bridge.CallOpts, chainId, sequence, voter)
}

// HasVoted0 is a free data retrieval call binding the contract method 0xaadc3b72.
//
// Solidity: function hasVoted(bytes32 packetHash, address voter) view returns(bool)
func (_Bridge *BridgeCaller) HasVoted0(opts *bind.CallOpts, packetHash [32]byte, voter common.Address) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "hasVoted0", packetHash, voter)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// HasVoted0 is a free data retrieval call binding the contract method 0xaadc3b72.
//
// Solidity: function hasVoted(bytes32 packetHash, address voter) view returns(bool)
func (_Bridge *BridgeSession) HasVoted0(packetHash [32]byte, voter common.Address) (bool, error) {
	return _Bridge.Contract.HasVoted0(&_Bridge.CallOpts, packetHash, voter)
}

// HasVoted0 is a free data retrieval call binding the contract method 0xaadc3b72.
//
// Solidity: function hasVoted(bytes32 packetHash, address voter) view returns(bool)
func (_Bridge *BridgeCallerSession) HasVoted0(packetHash [32]byte, voter common.Address) (bool, error) {
	return _Bridge.Contract.HasVoted0(&_Bridge.CallOpts, packetHash, voter)
}

// Hash is a free data retrieval call binding the contract method 0xe1fe7fdf.
//
// Solidity: function hash((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet) pure returns(bytes32)
func (_Bridge *BridgeCaller) Hash(opts *bind.CallOpts, packet PacketLibraryInPacket) ([32]byte, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "hash", packet)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// Hash is a free data retrieval call binding the contract method 0xe1fe7fdf.
//
// Solidity: function hash((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet) pure returns(bytes32)
func (_Bridge *BridgeSession) Hash(packet PacketLibraryInPacket) ([32]byte, error) {
	return _Bridge.Contract.Hash(&_Bridge.CallOpts, packet)
}

// Hash is a free data retrieval call binding the contract method 0xe1fe7fdf.
//
// Solidity: function hash((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet) pure returns(bytes32)
func (_Bridge *BridgeCallerSession) Hash(packet PacketLibraryInPacket) ([32]byte, error) {
	return _Bridge.Contract.Hash(&_Bridge.CallOpts, packet)
}

// IncomingPackets is a free data retrieval call binding the contract method 0x03d1d693.
//
// Solidity: function incomingPackets(uint256 , uint256 ) view returns(bytes32)
func (_Bridge *BridgeCaller) IncomingPackets(opts *bind.CallOpts, arg0 *big.Int, arg1 *big.Int) ([32]byte, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "incomingPackets", arg0, arg1)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// IncomingPackets is a free data retrieval call binding the contract method 0x03d1d693.
//
// Solidity: function incomingPackets(uint256 , uint256 ) view returns(bytes32)
func (_Bridge *BridgeSession) IncomingPackets(arg0 *big.Int, arg1 *big.Int) ([32]byte, error) {
	return _Bridge.Contract.IncomingPackets(&_Bridge.CallOpts, arg0, arg1)
}

// IncomingPackets is a free data retrieval call binding the contract method 0x03d1d693.
//
// Solidity: function incomingPackets(uint256 , uint256 ) view returns(bytes32)
func (_Bridge *BridgeCallerSession) IncomingPackets(arg0 *big.Int, arg1 *big.Int) ([32]byte, error) {
	return _Bridge.Contract.IncomingPackets(&_Bridge.CallOpts, arg0, arg1)
}

// IsAttestor is a free data retrieval call binding the contract method 0x2e2f4e24.
//
// Solidity: function isAttestor(address attestor) view returns(bool)
func (_Bridge *BridgeCaller) IsAttestor(opts *bind.CallOpts, attestor common.Address) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "isAttestor", attestor)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsAttestor is a free data retrieval call binding the contract method 0x2e2f4e24.
//
// Solidity: function isAttestor(address attestor) view returns(bool)
func (_Bridge *BridgeSession) IsAttestor(attestor common.Address) (bool, error) {
	return _Bridge.Contract.IsAttestor(&_Bridge.CallOpts, attestor)
}

// IsAttestor is a free data retrieval call binding the contract method 0x2e2f4e24.
//
// Solidity: function isAttestor(address attestor) view returns(bool)
func (_Bridge *BridgeCallerSession) IsAttestor(attestor common.Address) (bool, error) {
	return _Bridge.Contract.IsAttestor(&_Bridge.CallOpts, attestor)
}

// IsPacketConsumed is a free data retrieval call binding the contract method 0x4d7fc58e.
//
// Solidity: function isPacketConsumed(uint256 _chainId, uint256 _sequence) view returns(bool)
func (_Bridge *BridgeCaller) IsPacketConsumed(opts *bind.CallOpts, _chainId *big.Int, _sequence *big.Int) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "isPacketConsumed", _chainId, _sequence)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsPacketConsumed is a free data retrieval call binding the contract method 0x4d7fc58e.
//
// Solidity: function isPacketConsumed(uint256 _chainId, uint256 _sequence) view returns(bool)
func (_Bridge *BridgeSession) IsPacketConsumed(_chainId *big.Int, _sequence *big.Int) (bool, error) {
	return _Bridge.Contract.IsPacketConsumed(&_Bridge.CallOpts, _chainId, _sequence)
}

// IsPacketConsumed is a free data retrieval call binding the contract method 0x4d7fc58e.
//
// Solidity: function isPacketConsumed(uint256 _chainId, uint256 _sequence) view returns(bool)
func (_Bridge *BridgeCallerSession) IsPacketConsumed(_chainId *big.Int, _sequence *big.Int) (bool, error) {
	return _Bridge.Contract.IsPacketConsumed(&_Bridge.CallOpts, _chainId, _sequence)
}

// IsRegisteredTokenService is a free data retrieval call binding the contract method 0x6b3da26f.
//
// Solidity: function isRegisteredTokenService(address tokenService) view returns(bool)
func (_Bridge *BridgeCaller) IsRegisteredTokenService(opts *bind.CallOpts, tokenService common.Address) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "isRegisteredTokenService", tokenService)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsRegisteredTokenService is a free data retrieval call binding the contract method 0x6b3da26f.
//
// Solidity: function isRegisteredTokenService(address tokenService) view returns(bool)
func (_Bridge *BridgeSession) IsRegisteredTokenService(tokenService common.Address) (bool, error) {
	return _Bridge.Contract.IsRegisteredTokenService(&_Bridge.CallOpts, tokenService)
}

// IsRegisteredTokenService is a free data retrieval call binding the contract method 0x6b3da26f.
//
// Solidity: function isRegisteredTokenService(address tokenService) view returns(bool)
func (_Bridge *BridgeCallerSession) IsRegisteredTokenService(tokenService common.Address) (bool, error) {
	return _Bridge.Contract.IsRegisteredTokenService(&_Bridge.CallOpts, tokenService)
}

// IsSupportedChain is a free data retrieval call binding the contract method 0x5153d467.
//
// Solidity: function isSupportedChain(uint256 chainId) view returns(bool)
func (_Bridge *BridgeCaller) IsSupportedChain(opts *bind.CallOpts, chainId *big.Int) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "isSupportedChain", chainId)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsSupportedChain is a free data retrieval call binding the contract method 0x5153d467.
//
// Solidity: function isSupportedChain(uint256 chainId) view returns(bool)
func (_Bridge *BridgeSession) IsSupportedChain(chainId *big.Int) (bool, error) {
	return _Bridge.Contract.IsSupportedChain(&_Bridge.CallOpts, chainId)
}

// IsSupportedChain is a free data retrieval call binding the contract method 0x5153d467.
//
// Solidity: function isSupportedChain(uint256 chainId) view returns(bool)
func (_Bridge *BridgeCallerSession) IsSupportedChain(chainId *big.Int) (bool, error) {
	return _Bridge.Contract.IsSupportedChain(&_Bridge.CallOpts, chainId)
}

// OutgoingPackets is a free data retrieval call binding the contract method 0x188b5339.
//
// Solidity: function outgoingPackets(uint256 , uint256 ) view returns(uint256 version, uint256 sequence, (uint256,address) sourceTokenService, (uint256,string) destTokenService, (address,string,uint256,string) message, uint256 height)
func (_Bridge *BridgeCaller) OutgoingPackets(opts *bind.CallOpts, arg0 *big.Int, arg1 *big.Int) (struct {
	Version            *big.Int
	Sequence           *big.Int
	SourceTokenService PacketLibraryInNetworkAddress
	DestTokenService   PacketLibraryOutNetworkAddress
	Message            PacketLibraryOutTokenMessage
	Height             *big.Int
}, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "outgoingPackets", arg0, arg1)

	outstruct := new(struct {
		Version            *big.Int
		Sequence           *big.Int
		SourceTokenService PacketLibraryInNetworkAddress
		DestTokenService   PacketLibraryOutNetworkAddress
		Message            PacketLibraryOutTokenMessage
		Height             *big.Int
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.Version = *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)
	outstruct.Sequence = *abi.ConvertType(out[1], new(*big.Int)).(**big.Int)
	outstruct.SourceTokenService = *abi.ConvertType(out[2], new(PacketLibraryInNetworkAddress)).(*PacketLibraryInNetworkAddress)
	outstruct.DestTokenService = *abi.ConvertType(out[3], new(PacketLibraryOutNetworkAddress)).(*PacketLibraryOutNetworkAddress)
	outstruct.Message = *abi.ConvertType(out[4], new(PacketLibraryOutTokenMessage)).(*PacketLibraryOutTokenMessage)
	outstruct.Height = *abi.ConvertType(out[5], new(*big.Int)).(**big.Int)

	return *outstruct, err

}

// OutgoingPackets is a free data retrieval call binding the contract method 0x188b5339.
//
// Solidity: function outgoingPackets(uint256 , uint256 ) view returns(uint256 version, uint256 sequence, (uint256,address) sourceTokenService, (uint256,string) destTokenService, (address,string,uint256,string) message, uint256 height)
func (_Bridge *BridgeSession) OutgoingPackets(arg0 *big.Int, arg1 *big.Int) (struct {
	Version            *big.Int
	Sequence           *big.Int
	SourceTokenService PacketLibraryInNetworkAddress
	DestTokenService   PacketLibraryOutNetworkAddress
	Message            PacketLibraryOutTokenMessage
	Height             *big.Int
}, error) {
	return _Bridge.Contract.OutgoingPackets(&_Bridge.CallOpts, arg0, arg1)
}

// OutgoingPackets is a free data retrieval call binding the contract method 0x188b5339.
//
// Solidity: function outgoingPackets(uint256 , uint256 ) view returns(uint256 version, uint256 sequence, (uint256,address) sourceTokenService, (uint256,string) destTokenService, (address,string,uint256,string) message, uint256 height)
func (_Bridge *BridgeCallerSession) OutgoingPackets(arg0 *big.Int, arg1 *big.Int) (struct {
	Version            *big.Int
	Sequence           *big.Int
	SourceTokenService PacketLibraryInNetworkAddress
	DestTokenService   PacketLibraryOutNetworkAddress
	Message            PacketLibraryOutTokenMessage
	Height             *big.Int
}, error) {
	return _Bridge.Contract.OutgoingPackets(&_Bridge.CallOpts, arg0, arg1)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_Bridge *BridgeCaller) Owner(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "owner")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_Bridge *BridgeSession) Owner() (common.Address, error) {
	return _Bridge.Contract.Owner(&_Bridge.CallOpts)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_Bridge *BridgeCallerSession) Owner() (common.Address, error) {
	return _Bridge.Contract.Owner(&_Bridge.CallOpts)
}

// QuorumRequired is a free data retrieval call binding the contract method 0x088868e8.
//
// Solidity: function quorumRequired() view returns(uint256)
func (_Bridge *BridgeCaller) QuorumRequired(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "quorumRequired")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// QuorumRequired is a free data retrieval call binding the contract method 0x088868e8.
//
// Solidity: function quorumRequired() view returns(uint256)
func (_Bridge *BridgeSession) QuorumRequired() (*big.Int, error) {
	return _Bridge.Contract.QuorumRequired(&_Bridge.CallOpts)
}

// QuorumRequired is a free data retrieval call binding the contract method 0x088868e8.
//
// Solidity: function quorumRequired() view returns(uint256)
func (_Bridge *BridgeCallerSession) QuorumRequired() (*big.Int, error) {
	return _Bridge.Contract.QuorumRequired(&_Bridge.CallOpts)
}

// Sequences is a free data retrieval call binding the contract method 0xc86a64f7.
//
// Solidity: function sequences(uint256 ) view returns(uint256)
func (_Bridge *BridgeCaller) Sequences(opts *bind.CallOpts, arg0 *big.Int) (*big.Int, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "sequences", arg0)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// Sequences is a free data retrieval call binding the contract method 0xc86a64f7.
//
// Solidity: function sequences(uint256 ) view returns(uint256)
func (_Bridge *BridgeSession) Sequences(arg0 *big.Int) (*big.Int, error) {
	return _Bridge.Contract.Sequences(&_Bridge.CallOpts, arg0)
}

// Sequences is a free data retrieval call binding the contract method 0xc86a64f7.
//
// Solidity: function sequences(uint256 ) view returns(uint256)
func (_Bridge *BridgeCallerSession) Sequences(arg0 *big.Int) (*big.Int, error) {
	return _Bridge.Contract.Sequences(&_Bridge.CallOpts, arg0)
}

// AddAttestor is a paid mutator transaction binding the contract method 0xea6469f8.
//
// Solidity: function addAttestor(address attestor, uint256 newQuorumRequired) returns()
func (_Bridge *BridgeTransactor) AddAttestor(opts *bind.TransactOpts, attestor common.Address, newQuorumRequired *big.Int) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "addAttestor", attestor, newQuorumRequired)
}

// AddAttestor is a paid mutator transaction binding the contract method 0xea6469f8.
//
// Solidity: function addAttestor(address attestor, uint256 newQuorumRequired) returns()
func (_Bridge *BridgeSession) AddAttestor(attestor common.Address, newQuorumRequired *big.Int) (*types.Transaction, error) {
	return _Bridge.Contract.AddAttestor(&_Bridge.TransactOpts, attestor, newQuorumRequired)
}

// AddAttestor is a paid mutator transaction binding the contract method 0xea6469f8.
//
// Solidity: function addAttestor(address attestor, uint256 newQuorumRequired) returns()
func (_Bridge *BridgeTransactorSession) AddAttestor(attestor common.Address, newQuorumRequired *big.Int) (*types.Transaction, error) {
	return _Bridge.Contract.AddAttestor(&_Bridge.TransactOpts, attestor, newQuorumRequired)
}

// AddChain is a paid mutator transaction binding the contract method 0xaf83d4d8.
//
// Solidity: function addChain(uint256 chainId, string destBridgeAddress) returns()
func (_Bridge *BridgeTransactor) AddChain(opts *bind.TransactOpts, chainId *big.Int, destBridgeAddress string) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "addChain", chainId, destBridgeAddress)
}

// AddChain is a paid mutator transaction binding the contract method 0xaf83d4d8.
//
// Solidity: function addChain(uint256 chainId, string destBridgeAddress) returns()
func (_Bridge *BridgeSession) AddChain(chainId *big.Int, destBridgeAddress string) (*types.Transaction, error) {
	return _Bridge.Contract.AddChain(&_Bridge.TransactOpts, chainId, destBridgeAddress)
}

// AddChain is a paid mutator transaction binding the contract method 0xaf83d4d8.
//
// Solidity: function addChain(uint256 chainId, string destBridgeAddress) returns()
func (_Bridge *BridgeTransactorSession) AddChain(chainId *big.Int, destBridgeAddress string) (*types.Transaction, error) {
	return _Bridge.Contract.AddChain(&_Bridge.TransactOpts, chainId, destBridgeAddress)
}

// AddTokenService is a paid mutator transaction binding the contract method 0xf78dd84d.
//
// Solidity: function addTokenService(address tokenService) returns()
func (_Bridge *BridgeTransactor) AddTokenService(opts *bind.TransactOpts, tokenService common.Address) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "addTokenService", tokenService)
}

// AddTokenService is a paid mutator transaction binding the contract method 0xf78dd84d.
//
// Solidity: function addTokenService(address tokenService) returns()
func (_Bridge *BridgeSession) AddTokenService(tokenService common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.AddTokenService(&_Bridge.TransactOpts, tokenService)
}

// AddTokenService is a paid mutator transaction binding the contract method 0xf78dd84d.
//
// Solidity: function addTokenService(address tokenService) returns()
func (_Bridge *BridgeTransactorSession) AddTokenService(tokenService common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.AddTokenService(&_Bridge.TransactOpts, tokenService)
}

// Consume is a paid mutator transaction binding the contract method 0x68829296.
//
// Solidity: function consume((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet) returns()
func (_Bridge *BridgeTransactor) Consume(opts *bind.TransactOpts, packet PacketLibraryInPacket) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "consume", packet)
}

// Consume is a paid mutator transaction binding the contract method 0x68829296.
//
// Solidity: function consume((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet) returns()
func (_Bridge *BridgeSession) Consume(packet PacketLibraryInPacket) (*types.Transaction, error) {
	return _Bridge.Contract.Consume(&_Bridge.TransactOpts, packet)
}

// Consume is a paid mutator transaction binding the contract method 0x68829296.
//
// Solidity: function consume((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet) returns()
func (_Bridge *BridgeTransactorSession) Consume(packet PacketLibraryInPacket) (*types.Transaction, error) {
	return _Bridge.Contract.Consume(&_Bridge.TransactOpts, packet)
}

// Initialize is a paid mutator transaction binding the contract method 0xc4d66de8.
//
// Solidity: function initialize(address _owner) returns()
func (_Bridge *BridgeTransactor) Initialize(opts *bind.TransactOpts, _owner common.Address) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "initialize", _owner)
}

// Initialize is a paid mutator transaction binding the contract method 0xc4d66de8.
//
// Solidity: function initialize(address _owner) returns()
func (_Bridge *BridgeSession) Initialize(_owner common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.Initialize(&_Bridge.TransactOpts, _owner)
}

// Initialize is a paid mutator transaction binding the contract method 0xc4d66de8.
//
// Solidity: function initialize(address _owner) returns()
func (_Bridge *BridgeTransactorSession) Initialize(_owner common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.Initialize(&_Bridge.TransactOpts, _owner)
}

// ReceivePacket is a paid mutator transaction binding the contract method 0xec4eef87.
//
// Solidity: function receivePacket((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet) returns()
func (_Bridge *BridgeTransactor) ReceivePacket(opts *bind.TransactOpts, packet PacketLibraryInPacket) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "receivePacket", packet)
}

// ReceivePacket is a paid mutator transaction binding the contract method 0xec4eef87.
//
// Solidity: function receivePacket((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet) returns()
func (_Bridge *BridgeSession) ReceivePacket(packet PacketLibraryInPacket) (*types.Transaction, error) {
	return _Bridge.Contract.ReceivePacket(&_Bridge.TransactOpts, packet)
}

// ReceivePacket is a paid mutator transaction binding the contract method 0xec4eef87.
//
// Solidity: function receivePacket((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet) returns()
func (_Bridge *BridgeTransactorSession) ReceivePacket(packet PacketLibraryInPacket) (*types.Transaction, error) {
	return _Bridge.Contract.ReceivePacket(&_Bridge.TransactOpts, packet)
}

// ReceivePacketBatch is a paid mutator transaction binding the contract method 0xd49efc6c.
//
// Solidity: function receivePacketBatch((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256)[] packets) returns()
func (_Bridge *BridgeTransactor) ReceivePacketBatch(opts *bind.TransactOpts, packets []PacketLibraryInPacket) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "receivePacketBatch", packets)
}

// ReceivePacketBatch is a paid mutator transaction binding the contract method 0xd49efc6c.
//
// Solidity: function receivePacketBatch((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256)[] packets) returns()
func (_Bridge *BridgeSession) ReceivePacketBatch(packets []PacketLibraryInPacket) (*types.Transaction, error) {
	return _Bridge.Contract.ReceivePacketBatch(&_Bridge.TransactOpts, packets)
}

// ReceivePacketBatch is a paid mutator transaction binding the contract method 0xd49efc6c.
//
// Solidity: function receivePacketBatch((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256)[] packets) returns()
func (_Bridge *BridgeTransactorSession) ReceivePacketBatch(packets []PacketLibraryInPacket) (*types.Transaction, error) {
	return _Bridge.Contract.ReceivePacketBatch(&_Bridge.TransactOpts, packets)
}

// RemoveAttestor is a paid mutator transaction binding the contract method 0x91e8d207.
//
// Solidity: function removeAttestor(address attestor, uint256 newQuorumRequired) returns()
func (_Bridge *BridgeTransactor) RemoveAttestor(opts *bind.TransactOpts, attestor common.Address, newQuorumRequired *big.Int) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "removeAttestor", attestor, newQuorumRequired)
}

// RemoveAttestor is a paid mutator transaction binding the contract method 0x91e8d207.
//
// Solidity: function removeAttestor(address attestor, uint256 newQuorumRequired) returns()
func (_Bridge *BridgeSession) RemoveAttestor(attestor common.Address, newQuorumRequired *big.Int) (*types.Transaction, error) {
	return _Bridge.Contract.RemoveAttestor(&_Bridge.TransactOpts, attestor, newQuorumRequired)
}

// RemoveAttestor is a paid mutator transaction binding the contract method 0x91e8d207.
//
// Solidity: function removeAttestor(address attestor, uint256 newQuorumRequired) returns()
func (_Bridge *BridgeTransactorSession) RemoveAttestor(attestor common.Address, newQuorumRequired *big.Int) (*types.Transaction, error) {
	return _Bridge.Contract.RemoveAttestor(&_Bridge.TransactOpts, attestor, newQuorumRequired)
}

// RemoveChain is a paid mutator transaction binding the contract method 0xcbf50bb6.
//
// Solidity: function removeChain(uint256 chainId) returns()
func (_Bridge *BridgeTransactor) RemoveChain(opts *bind.TransactOpts, chainId *big.Int) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "removeChain", chainId)
}

// RemoveChain is a paid mutator transaction binding the contract method 0xcbf50bb6.
//
// Solidity: function removeChain(uint256 chainId) returns()
func (_Bridge *BridgeSession) RemoveChain(chainId *big.Int) (*types.Transaction, error) {
	return _Bridge.Contract.RemoveChain(&_Bridge.TransactOpts, chainId)
}

// RemoveChain is a paid mutator transaction binding the contract method 0xcbf50bb6.
//
// Solidity: function removeChain(uint256 chainId) returns()
func (_Bridge *BridgeTransactorSession) RemoveChain(chainId *big.Int) (*types.Transaction, error) {
	return _Bridge.Contract.RemoveChain(&_Bridge.TransactOpts, chainId)
}

// RemoveTokenService is a paid mutator transaction binding the contract method 0x05cd5a36.
//
// Solidity: function removeTokenService(address tokenService) returns()
func (_Bridge *BridgeTransactor) RemoveTokenService(opts *bind.TransactOpts, tokenService common.Address) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "removeTokenService", tokenService)
}

// RemoveTokenService is a paid mutator transaction binding the contract method 0x05cd5a36.
//
// Solidity: function removeTokenService(address tokenService) returns()
func (_Bridge *BridgeSession) RemoveTokenService(tokenService common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.RemoveTokenService(&_Bridge.TransactOpts, tokenService)
}

// RemoveTokenService is a paid mutator transaction binding the contract method 0x05cd5a36.
//
// Solidity: function removeTokenService(address tokenService) returns()
func (_Bridge *BridgeTransactorSession) RemoveTokenService(tokenService common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.RemoveTokenService(&_Bridge.TransactOpts, tokenService)
}

// SendMessage is a paid mutator transaction binding the contract method 0xe71d86dc.
//
// Solidity: function sendMessage((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256) packet) returns()
func (_Bridge *BridgeTransactor) SendMessage(opts *bind.TransactOpts, packet PacketLibraryOutPacket) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "sendMessage", packet)
}

// SendMessage is a paid mutator transaction binding the contract method 0xe71d86dc.
//
// Solidity: function sendMessage((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256) packet) returns()
func (_Bridge *BridgeSession) SendMessage(packet PacketLibraryOutPacket) (*types.Transaction, error) {
	return _Bridge.Contract.SendMessage(&_Bridge.TransactOpts, packet)
}

// SendMessage is a paid mutator transaction binding the contract method 0xe71d86dc.
//
// Solidity: function sendMessage((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256) packet) returns()
func (_Bridge *BridgeTransactorSession) SendMessage(packet PacketLibraryOutPacket) (*types.Transaction, error) {
	return _Bridge.Contract.SendMessage(&_Bridge.TransactOpts, packet)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_Bridge *BridgeTransactor) TransferOwnership(opts *bind.TransactOpts, newOwner common.Address) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "transferOwnership", newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_Bridge *BridgeSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.TransferOwnership(&_Bridge.TransactOpts, newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_Bridge *BridgeTransactorSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.TransferOwnership(&_Bridge.TransactOpts, newOwner)
}

// BridgeAlreadyVotedIterator is returned from FilterAlreadyVoted and is used to iterate over the raw logs and unpacked data for AlreadyVoted events raised by the Bridge contract.
type BridgeAlreadyVotedIterator struct {
	Event *BridgeAlreadyVoted // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *BridgeAlreadyVotedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeAlreadyVoted)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(BridgeAlreadyVoted)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *BridgeAlreadyVotedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeAlreadyVotedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeAlreadyVoted represents a AlreadyVoted event raised by the Bridge contract.
type BridgeAlreadyVoted struct {
	PacketHash [32]byte
	Voter      common.Address
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterAlreadyVoted is a free log retrieval operation binding the contract event 0x0bcf2ea3c8b515fe50f169a4131ce2d2198afc8ec7d83a8658d7bcb0a5fbbe77.
//
// Solidity: event AlreadyVoted(bytes32 packetHash, address voter)
func (_Bridge *BridgeFilterer) FilterAlreadyVoted(opts *bind.FilterOpts) (*BridgeAlreadyVotedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "AlreadyVoted")
	if err != nil {
		return nil, err
	}
	return &BridgeAlreadyVotedIterator{contract: _Bridge.contract, event: "AlreadyVoted", logs: logs, sub: sub}, nil
}

// WatchAlreadyVoted is a free log subscription operation binding the contract event 0x0bcf2ea3c8b515fe50f169a4131ce2d2198afc8ec7d83a8658d7bcb0a5fbbe77.
//
// Solidity: event AlreadyVoted(bytes32 packetHash, address voter)
func (_Bridge *BridgeFilterer) WatchAlreadyVoted(opts *bind.WatchOpts, sink chan<- *BridgeAlreadyVoted) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "AlreadyVoted")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeAlreadyVoted)
				if err := _Bridge.contract.UnpackLog(event, "AlreadyVoted", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseAlreadyVoted is a log parse operation binding the contract event 0x0bcf2ea3c8b515fe50f169a4131ce2d2198afc8ec7d83a8658d7bcb0a5fbbe77.
//
// Solidity: event AlreadyVoted(bytes32 packetHash, address voter)
func (_Bridge *BridgeFilterer) ParseAlreadyVoted(log types.Log) (*BridgeAlreadyVoted, error) {
	event := new(BridgeAlreadyVoted)
	if err := _Bridge.contract.UnpackLog(event, "AlreadyVoted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeAttestorAddedIterator is returned from FilterAttestorAdded and is used to iterate over the raw logs and unpacked data for AttestorAdded events raised by the Bridge contract.
type BridgeAttestorAddedIterator struct {
	Event *BridgeAttestorAdded // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *BridgeAttestorAddedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeAttestorAdded)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(BridgeAttestorAdded)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *BridgeAttestorAddedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeAttestorAddedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeAttestorAdded represents a AttestorAdded event raised by the Bridge contract.
type BridgeAttestorAdded struct {
	Attestor common.Address
	Quorum   *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterAttestorAdded is a free log retrieval operation binding the contract event 0x3048c9ea63a33da5ed9a73829970fa3c31e6a8b32bbc5747e24632f61c027e8e.
//
// Solidity: event AttestorAdded(address attestor, uint256 quorum)
func (_Bridge *BridgeFilterer) FilterAttestorAdded(opts *bind.FilterOpts) (*BridgeAttestorAddedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "AttestorAdded")
	if err != nil {
		return nil, err
	}
	return &BridgeAttestorAddedIterator{contract: _Bridge.contract, event: "AttestorAdded", logs: logs, sub: sub}, nil
}

// WatchAttestorAdded is a free log subscription operation binding the contract event 0x3048c9ea63a33da5ed9a73829970fa3c31e6a8b32bbc5747e24632f61c027e8e.
//
// Solidity: event AttestorAdded(address attestor, uint256 quorum)
func (_Bridge *BridgeFilterer) WatchAttestorAdded(opts *bind.WatchOpts, sink chan<- *BridgeAttestorAdded) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "AttestorAdded")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeAttestorAdded)
				if err := _Bridge.contract.UnpackLog(event, "AttestorAdded", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseAttestorAdded is a log parse operation binding the contract event 0x3048c9ea63a33da5ed9a73829970fa3c31e6a8b32bbc5747e24632f61c027e8e.
//
// Solidity: event AttestorAdded(address attestor, uint256 quorum)
func (_Bridge *BridgeFilterer) ParseAttestorAdded(log types.Log) (*BridgeAttestorAdded, error) {
	event := new(BridgeAttestorAdded)
	if err := _Bridge.contract.UnpackLog(event, "AttestorAdded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeAttestorRemovedIterator is returned from FilterAttestorRemoved and is used to iterate over the raw logs and unpacked data for AttestorRemoved events raised by the Bridge contract.
type BridgeAttestorRemovedIterator struct {
	Event *BridgeAttestorRemoved // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *BridgeAttestorRemovedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeAttestorRemoved)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(BridgeAttestorRemoved)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *BridgeAttestorRemovedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeAttestorRemovedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeAttestorRemoved represents a AttestorRemoved event raised by the Bridge contract.
type BridgeAttestorRemoved struct {
	Attestor common.Address
	Quorum   *big.Int
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterAttestorRemoved is a free log retrieval operation binding the contract event 0x4d9baafb1aaa72b5de32bbdb949ea3d6be986b9989a747834d6470df6738352d.
//
// Solidity: event AttestorRemoved(address attestor, uint256 quorum)
func (_Bridge *BridgeFilterer) FilterAttestorRemoved(opts *bind.FilterOpts) (*BridgeAttestorRemovedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "AttestorRemoved")
	if err != nil {
		return nil, err
	}
	return &BridgeAttestorRemovedIterator{contract: _Bridge.contract, event: "AttestorRemoved", logs: logs, sub: sub}, nil
}

// WatchAttestorRemoved is a free log subscription operation binding the contract event 0x4d9baafb1aaa72b5de32bbdb949ea3d6be986b9989a747834d6470df6738352d.
//
// Solidity: event AttestorRemoved(address attestor, uint256 quorum)
func (_Bridge *BridgeFilterer) WatchAttestorRemoved(opts *bind.WatchOpts, sink chan<- *BridgeAttestorRemoved) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "AttestorRemoved")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeAttestorRemoved)
				if err := _Bridge.contract.UnpackLog(event, "AttestorRemoved", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseAttestorRemoved is a log parse operation binding the contract event 0x4d9baafb1aaa72b5de32bbdb949ea3d6be986b9989a747834d6470df6738352d.
//
// Solidity: event AttestorRemoved(address attestor, uint256 quorum)
func (_Bridge *BridgeFilterer) ParseAttestorRemoved(log types.Log) (*BridgeAttestorRemoved, error) {
	event := new(BridgeAttestorRemoved)
	if err := _Bridge.contract.UnpackLog(event, "AttestorRemoved", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeChainAddedIterator is returned from FilterChainAdded and is used to iterate over the raw logs and unpacked data for ChainAdded events raised by the Bridge contract.
type BridgeChainAddedIterator struct {
	Event *BridgeChainAdded // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *BridgeChainAddedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeChainAdded)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(BridgeChainAdded)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *BridgeChainAddedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeChainAddedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeChainAdded represents a ChainAdded event raised by the Bridge contract.
type BridgeChainAdded struct {
	Chain PacketLibraryOutNetworkAddress
	Raw   types.Log // Blockchain specific contextual infos
}

// FilterChainAdded is a free log retrieval operation binding the contract event 0x98d2ada6e8e6c16dc5c0cd7305c7ea2a5487d613218c7498c4b1ce5c8fbd4525.
//
// Solidity: event ChainAdded((uint256,string) chain)
func (_Bridge *BridgeFilterer) FilterChainAdded(opts *bind.FilterOpts) (*BridgeChainAddedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "ChainAdded")
	if err != nil {
		return nil, err
	}
	return &BridgeChainAddedIterator{contract: _Bridge.contract, event: "ChainAdded", logs: logs, sub: sub}, nil
}

// WatchChainAdded is a free log subscription operation binding the contract event 0x98d2ada6e8e6c16dc5c0cd7305c7ea2a5487d613218c7498c4b1ce5c8fbd4525.
//
// Solidity: event ChainAdded((uint256,string) chain)
func (_Bridge *BridgeFilterer) WatchChainAdded(opts *bind.WatchOpts, sink chan<- *BridgeChainAdded) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "ChainAdded")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeChainAdded)
				if err := _Bridge.contract.UnpackLog(event, "ChainAdded", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseChainAdded is a log parse operation binding the contract event 0x98d2ada6e8e6c16dc5c0cd7305c7ea2a5487d613218c7498c4b1ce5c8fbd4525.
//
// Solidity: event ChainAdded((uint256,string) chain)
func (_Bridge *BridgeFilterer) ParseChainAdded(log types.Log) (*BridgeChainAdded, error) {
	event := new(BridgeChainAdded)
	if err := _Bridge.contract.UnpackLog(event, "ChainAdded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeChainRemovedIterator is returned from FilterChainRemoved and is used to iterate over the raw logs and unpacked data for ChainRemoved events raised by the Bridge contract.
type BridgeChainRemovedIterator struct {
	Event *BridgeChainRemoved // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *BridgeChainRemovedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeChainRemoved)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(BridgeChainRemoved)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *BridgeChainRemovedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeChainRemovedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeChainRemoved represents a ChainRemoved event raised by the Bridge contract.
type BridgeChainRemoved struct {
	ChainId *big.Int
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterChainRemoved is a free log retrieval operation binding the contract event 0x11a9d1a77f76361ed131c19b1dc5758504c51dbde2e49fc973a0ef9577ad13d5.
//
// Solidity: event ChainRemoved(uint256 chainId)
func (_Bridge *BridgeFilterer) FilterChainRemoved(opts *bind.FilterOpts) (*BridgeChainRemovedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "ChainRemoved")
	if err != nil {
		return nil, err
	}
	return &BridgeChainRemovedIterator{contract: _Bridge.contract, event: "ChainRemoved", logs: logs, sub: sub}, nil
}

// WatchChainRemoved is a free log subscription operation binding the contract event 0x11a9d1a77f76361ed131c19b1dc5758504c51dbde2e49fc973a0ef9577ad13d5.
//
// Solidity: event ChainRemoved(uint256 chainId)
func (_Bridge *BridgeFilterer) WatchChainRemoved(opts *bind.WatchOpts, sink chan<- *BridgeChainRemoved) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "ChainRemoved")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeChainRemoved)
				if err := _Bridge.contract.UnpackLog(event, "ChainRemoved", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseChainRemoved is a log parse operation binding the contract event 0x11a9d1a77f76361ed131c19b1dc5758504c51dbde2e49fc973a0ef9577ad13d5.
//
// Solidity: event ChainRemoved(uint256 chainId)
func (_Bridge *BridgeFilterer) ParseChainRemoved(log types.Log) (*BridgeChainRemoved, error) {
	event := new(BridgeChainRemoved)
	if err := _Bridge.contract.UnpackLog(event, "ChainRemoved", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeConsumedIterator is returned from FilterConsumed and is used to iterate over the raw logs and unpacked data for Consumed events raised by the Bridge contract.
type BridgeConsumedIterator struct {
	Event *BridgeConsumed // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *BridgeConsumedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeConsumed)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(BridgeConsumed)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *BridgeConsumedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeConsumedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeConsumed represents a Consumed event raised by the Bridge contract.
type BridgeConsumed struct {
	ChainId    *big.Int
	Sequence   *big.Int
	PacketHash [32]byte
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterConsumed is a free log retrieval operation binding the contract event 0x4de00275c41d5791efd85ee6693384f774ad509f1c2c92197abf83526206245d.
//
// Solidity: event Consumed(uint256 chainId, uint256 sequence, bytes32 packetHash)
func (_Bridge *BridgeFilterer) FilterConsumed(opts *bind.FilterOpts) (*BridgeConsumedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "Consumed")
	if err != nil {
		return nil, err
	}
	return &BridgeConsumedIterator{contract: _Bridge.contract, event: "Consumed", logs: logs, sub: sub}, nil
}

// WatchConsumed is a free log subscription operation binding the contract event 0x4de00275c41d5791efd85ee6693384f774ad509f1c2c92197abf83526206245d.
//
// Solidity: event Consumed(uint256 chainId, uint256 sequence, bytes32 packetHash)
func (_Bridge *BridgeFilterer) WatchConsumed(opts *bind.WatchOpts, sink chan<- *BridgeConsumed) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "Consumed")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeConsumed)
				if err := _Bridge.contract.UnpackLog(event, "Consumed", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseConsumed is a log parse operation binding the contract event 0x4de00275c41d5791efd85ee6693384f774ad509f1c2c92197abf83526206245d.
//
// Solidity: event Consumed(uint256 chainId, uint256 sequence, bytes32 packetHash)
func (_Bridge *BridgeFilterer) ParseConsumed(log types.Log) (*BridgeConsumed, error) {
	event := new(BridgeConsumed)
	if err := _Bridge.contract.UnpackLog(event, "Consumed", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeInitializedIterator is returned from FilterInitialized and is used to iterate over the raw logs and unpacked data for Initialized events raised by the Bridge contract.
type BridgeInitializedIterator struct {
	Event *BridgeInitialized // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *BridgeInitializedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeInitialized)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(BridgeInitialized)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *BridgeInitializedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeInitializedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeInitialized represents a Initialized event raised by the Bridge contract.
type BridgeInitialized struct {
	Version uint8
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterInitialized is a free log retrieval operation binding the contract event 0x7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb3847402498.
//
// Solidity: event Initialized(uint8 version)
func (_Bridge *BridgeFilterer) FilterInitialized(opts *bind.FilterOpts) (*BridgeInitializedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return &BridgeInitializedIterator{contract: _Bridge.contract, event: "Initialized", logs: logs, sub: sub}, nil
}

// WatchInitialized is a free log subscription operation binding the contract event 0x7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb3847402498.
//
// Solidity: event Initialized(uint8 version)
func (_Bridge *BridgeFilterer) WatchInitialized(opts *bind.WatchOpts, sink chan<- *BridgeInitialized) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeInitialized)
				if err := _Bridge.contract.UnpackLog(event, "Initialized", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseInitialized is a log parse operation binding the contract event 0x7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb3847402498.
//
// Solidity: event Initialized(uint8 version)
func (_Bridge *BridgeFilterer) ParseInitialized(log types.Log) (*BridgeInitialized, error) {
	event := new(BridgeInitialized)
	if err := _Bridge.contract.UnpackLog(event, "Initialized", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgePacketArrivedIterator is returned from FilterPacketArrived and is used to iterate over the raw logs and unpacked data for PacketArrived events raised by the Bridge contract.
type BridgePacketArrivedIterator struct {
	Event *BridgePacketArrived // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *BridgePacketArrivedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgePacketArrived)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(BridgePacketArrived)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *BridgePacketArrivedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgePacketArrivedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgePacketArrived represents a PacketArrived event raised by the Bridge contract.
type BridgePacketArrived struct {
	Packet PacketLibraryInPacket
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterPacketArrived is a free log retrieval operation binding the contract event 0x3d20a5484fc3b8af07f88f0149aaa1ce0ed6cc017d189d94dc7ddeb552c26c5b.
//
// Solidity: event PacketArrived((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet)
func (_Bridge *BridgeFilterer) FilterPacketArrived(opts *bind.FilterOpts) (*BridgePacketArrivedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "PacketArrived")
	if err != nil {
		return nil, err
	}
	return &BridgePacketArrivedIterator{contract: _Bridge.contract, event: "PacketArrived", logs: logs, sub: sub}, nil
}

// WatchPacketArrived is a free log subscription operation binding the contract event 0x3d20a5484fc3b8af07f88f0149aaa1ce0ed6cc017d189d94dc7ddeb552c26c5b.
//
// Solidity: event PacketArrived((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet)
func (_Bridge *BridgeFilterer) WatchPacketArrived(opts *bind.WatchOpts, sink chan<- *BridgePacketArrived) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "PacketArrived")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgePacketArrived)
				if err := _Bridge.contract.UnpackLog(event, "PacketArrived", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParsePacketArrived is a log parse operation binding the contract event 0x3d20a5484fc3b8af07f88f0149aaa1ce0ed6cc017d189d94dc7ddeb552c26c5b.
//
// Solidity: event PacketArrived((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet)
func (_Bridge *BridgeFilterer) ParsePacketArrived(log types.Log) (*BridgePacketArrived, error) {
	event := new(BridgePacketArrived)
	if err := _Bridge.contract.UnpackLog(event, "PacketArrived", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgePacketDispatchedIterator is returned from FilterPacketDispatched and is used to iterate over the raw logs and unpacked data for PacketDispatched events raised by the Bridge contract.
type BridgePacketDispatchedIterator struct {
	Event *BridgePacketDispatched // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *BridgePacketDispatchedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgePacketDispatched)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(BridgePacketDispatched)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *BridgePacketDispatchedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgePacketDispatchedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgePacketDispatched represents a PacketDispatched event raised by the Bridge contract.
type BridgePacketDispatched struct {
	Packet PacketLibraryOutPacket
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterPacketDispatched is a free log retrieval operation binding the contract event 0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9.
//
// Solidity: event PacketDispatched((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256) packet)
func (_Bridge *BridgeFilterer) FilterPacketDispatched(opts *bind.FilterOpts) (*BridgePacketDispatchedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "PacketDispatched")
	if err != nil {
		return nil, err
	}
	return &BridgePacketDispatchedIterator{contract: _Bridge.contract, event: "PacketDispatched", logs: logs, sub: sub}, nil
}

// WatchPacketDispatched is a free log subscription operation binding the contract event 0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9.
//
// Solidity: event PacketDispatched((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256) packet)
func (_Bridge *BridgeFilterer) WatchPacketDispatched(opts *bind.WatchOpts, sink chan<- *BridgePacketDispatched) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "PacketDispatched")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgePacketDispatched)
				if err := _Bridge.contract.UnpackLog(event, "PacketDispatched", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParsePacketDispatched is a log parse operation binding the contract event 0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9.
//
// Solidity: event PacketDispatched((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256) packet)
func (_Bridge *BridgeFilterer) ParsePacketDispatched(log types.Log) (*BridgePacketDispatched, error) {
	event := new(BridgePacketDispatched)
	if err := _Bridge.contract.UnpackLog(event, "PacketDispatched", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeTokenServiceAddedIterator is returned from FilterTokenServiceAdded and is used to iterate over the raw logs and unpacked data for TokenServiceAdded events raised by the Bridge contract.
type BridgeTokenServiceAddedIterator struct {
	Event *BridgeTokenServiceAdded // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *BridgeTokenServiceAddedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeTokenServiceAdded)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(BridgeTokenServiceAdded)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *BridgeTokenServiceAddedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeTokenServiceAddedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeTokenServiceAdded represents a TokenServiceAdded event raised by the Bridge contract.
type BridgeTokenServiceAdded struct {
	TokenService common.Address
	Raw          types.Log // Blockchain specific contextual infos
}

// FilterTokenServiceAdded is a free log retrieval operation binding the contract event 0x94a4797e4c030e498da08bb8871d39298528d0f1269fba1da4363703331d58e9.
//
// Solidity: event TokenServiceAdded(address tokenService)
func (_Bridge *BridgeFilterer) FilterTokenServiceAdded(opts *bind.FilterOpts) (*BridgeTokenServiceAddedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "TokenServiceAdded")
	if err != nil {
		return nil, err
	}
	return &BridgeTokenServiceAddedIterator{contract: _Bridge.contract, event: "TokenServiceAdded", logs: logs, sub: sub}, nil
}

// WatchTokenServiceAdded is a free log subscription operation binding the contract event 0x94a4797e4c030e498da08bb8871d39298528d0f1269fba1da4363703331d58e9.
//
// Solidity: event TokenServiceAdded(address tokenService)
func (_Bridge *BridgeFilterer) WatchTokenServiceAdded(opts *bind.WatchOpts, sink chan<- *BridgeTokenServiceAdded) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "TokenServiceAdded")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeTokenServiceAdded)
				if err := _Bridge.contract.UnpackLog(event, "TokenServiceAdded", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseTokenServiceAdded is a log parse operation binding the contract event 0x94a4797e4c030e498da08bb8871d39298528d0f1269fba1da4363703331d58e9.
//
// Solidity: event TokenServiceAdded(address tokenService)
func (_Bridge *BridgeFilterer) ParseTokenServiceAdded(log types.Log) (*BridgeTokenServiceAdded, error) {
	event := new(BridgeTokenServiceAdded)
	if err := _Bridge.contract.UnpackLog(event, "TokenServiceAdded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeTokenServiceRemovedIterator is returned from FilterTokenServiceRemoved and is used to iterate over the raw logs and unpacked data for TokenServiceRemoved events raised by the Bridge contract.
type BridgeTokenServiceRemovedIterator struct {
	Event *BridgeTokenServiceRemoved // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *BridgeTokenServiceRemovedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeTokenServiceRemoved)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(BridgeTokenServiceRemoved)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *BridgeTokenServiceRemovedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeTokenServiceRemovedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeTokenServiceRemoved represents a TokenServiceRemoved event raised by the Bridge contract.
type BridgeTokenServiceRemoved struct {
	TokenService common.Address
	Raw          types.Log // Blockchain specific contextual infos
}

// FilterTokenServiceRemoved is a free log retrieval operation binding the contract event 0x18952ed4229327e2d83d53a06b823c2da3b19cb320c82017b8da5f60b6dfe8f0.
//
// Solidity: event TokenServiceRemoved(address tokenService)
func (_Bridge *BridgeFilterer) FilterTokenServiceRemoved(opts *bind.FilterOpts) (*BridgeTokenServiceRemovedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "TokenServiceRemoved")
	if err != nil {
		return nil, err
	}
	return &BridgeTokenServiceRemovedIterator{contract: _Bridge.contract, event: "TokenServiceRemoved", logs: logs, sub: sub}, nil
}

// WatchTokenServiceRemoved is a free log subscription operation binding the contract event 0x18952ed4229327e2d83d53a06b823c2da3b19cb320c82017b8da5f60b6dfe8f0.
//
// Solidity: event TokenServiceRemoved(address tokenService)
func (_Bridge *BridgeFilterer) WatchTokenServiceRemoved(opts *bind.WatchOpts, sink chan<- *BridgeTokenServiceRemoved) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "TokenServiceRemoved")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeTokenServiceRemoved)
				if err := _Bridge.contract.UnpackLog(event, "TokenServiceRemoved", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseTokenServiceRemoved is a log parse operation binding the contract event 0x18952ed4229327e2d83d53a06b823c2da3b19cb320c82017b8da5f60b6dfe8f0.
//
// Solidity: event TokenServiceRemoved(address tokenService)
func (_Bridge *BridgeFilterer) ParseTokenServiceRemoved(log types.Log) (*BridgeTokenServiceRemoved, error) {
	event := new(BridgeTokenServiceRemoved)
	if err := _Bridge.contract.UnpackLog(event, "TokenServiceRemoved", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeVotedIterator is returned from FilterVoted and is used to iterate over the raw logs and unpacked data for Voted events raised by the Bridge contract.
type BridgeVotedIterator struct {
	Event *BridgeVoted // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *BridgeVotedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeVoted)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(BridgeVoted)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *BridgeVotedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeVotedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeVoted represents a Voted event raised by the Bridge contract.
type BridgeVoted struct {
	PacketHash [32]byte
	Voter      common.Address
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterVoted is a free log retrieval operation binding the contract event 0x0b2f654b7e608ce51a82ce8157e79c350ed670605e8985266ad89fc85060e749.
//
// Solidity: event Voted(bytes32 packetHash, address voter)
func (_Bridge *BridgeFilterer) FilterVoted(opts *bind.FilterOpts) (*BridgeVotedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "Voted")
	if err != nil {
		return nil, err
	}
	return &BridgeVotedIterator{contract: _Bridge.contract, event: "Voted", logs: logs, sub: sub}, nil
}

// WatchVoted is a free log subscription operation binding the contract event 0x0b2f654b7e608ce51a82ce8157e79c350ed670605e8985266ad89fc85060e749.
//
// Solidity: event Voted(bytes32 packetHash, address voter)
func (_Bridge *BridgeFilterer) WatchVoted(opts *bind.WatchOpts, sink chan<- *BridgeVoted) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "Voted")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeVoted)
				if err := _Bridge.contract.UnpackLog(event, "Voted", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseVoted is a log parse operation binding the contract event 0x0b2f654b7e608ce51a82ce8157e79c350ed670605e8985266ad89fc85060e749.
//
// Solidity: event Voted(bytes32 packetHash, address voter)
func (_Bridge *BridgeFilterer) ParseVoted(log types.Log) (*BridgeVoted, error) {
	event := new(BridgeVoted)
	if err := _Bridge.contract.UnpackLog(event, "Voted", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
