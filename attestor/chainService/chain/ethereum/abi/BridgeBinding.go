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
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"previousAdmin\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"newAdmin\",\"type\":\"address\"}],\"name\":\"AdminChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"attestor\",\"type\":\"address\"}],\"name\":\"AttestorAdded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"attestor\",\"type\":\"address\"}],\"name\":\"AttestorRemoved\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"beacon\",\"type\":\"address\"}],\"name\":\"BeaconUpgraded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"oldDestinationChainId\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newDestinationChainId\",\"type\":\"uint256\"}],\"name\":\"ChainUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"bytes32\",\"name\":\"packetHash\",\"type\":\"bytes32\"},{\"indexed\":false,\"internalType\":\"enumPacketLibrary.Vote\",\"name\":\"_quorum\",\"type\":\"uint8\"}],\"name\":\"Consumed\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint8\",\"name\":\"version\",\"type\":\"uint8\"}],\"name\":\"Initialized\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"previousOwner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"OwnershipTransferred\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"version\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InNetworkAddress\",\"name\":\"sourceTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"destTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"address\",\"name\":\"senderAddress\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"destTokenAddress\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"receiverAddress\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutTokenMessage\",\"name\":\"message\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"height\",\"type\":\"uint256\"}],\"indexed\":false,\"internalType\":\"structPacketLibrary.OutPacket\",\"name\":\"packet\",\"type\":\"tuple\"},{\"indexed\":false,\"internalType\":\"bytes\",\"name\":\"data\",\"type\":\"bytes\"}],\"name\":\"PacketDispatched\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"Paused\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"oldQuorum\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newQuorum\",\"type\":\"uint256\"}],\"name\":\"QuorumUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"tokenService\",\"type\":\"address\"}],\"name\":\"TokenServiceAdded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"tokenService\",\"type\":\"address\"}],\"name\":\"TokenServiceRemoved\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"Unpaused\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"implementation\",\"type\":\"address\"}],\"name\":\"Upgraded\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_destChainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"}],\"name\":\"Bridge_init\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"attestor\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"newQuorumRequired\",\"type\":\"uint256\"}],\"name\":\"addAttestor\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address[]\",\"name\":\"_attestors\",\"type\":\"address[]\"},{\"internalType\":\"uint256\",\"name\":\"newQuorumRequired\",\"type\":\"uint256\"}],\"name\":\"addAttestors\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_service\",\"type\":\"address\"}],\"name\":\"addTokenService\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"version\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"sourceTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InNetworkAddress\",\"name\":\"destTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"string\",\"name\":\"senderAddress\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"destTokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"receiverAddress\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InTokenMessage\",\"name\":\"message\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"height\",\"type\":\"uint256\"}],\"internalType\":\"structPacketLibrary.InPacket\",\"name\":\"packet\",\"type\":\"tuple\"},{\"internalType\":\"bytes\",\"name\":\"signatures\",\"type\":\"bytes\"}],\"name\":\"consume\",\"outputs\":[{\"internalType\":\"enumPacketLibrary.Vote\",\"name\":\"\",\"type\":\"uint8\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"consumedPackets\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"destinationChainId\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"attestor\",\"type\":\"address\"}],\"name\":\"isAttestor\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_sequence\",\"type\":\"uint256\"}],\"name\":\"isPacketConsumed\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_service\",\"type\":\"address\"}],\"name\":\"isRegisteredTokenService\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"destChainId\",\"type\":\"uint256\"}],\"name\":\"isSupportedChain\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"name\":\"outgoingPackets\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"owner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"pause\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"paused\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"proxiableUUID\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"quorumRequired\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"attestor\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"newQuorumRequired\",\"type\":\"uint256\"}],\"name\":\"removeAttestor\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_service\",\"type\":\"address\"}],\"name\":\"removeTokenService\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"renounceOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"version\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InNetworkAddress\",\"name\":\"sourceTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"destTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"address\",\"name\":\"senderAddress\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"destTokenAddress\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"receiverAddress\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutTokenMessage\",\"name\":\"message\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"height\",\"type\":\"uint256\"}],\"internalType\":\"structPacketLibrary.OutPacket\",\"name\":\"packet\",\"type\":\"tuple\"},{\"internalType\":\"bytes\",\"name\":\"data\",\"type\":\"bytes\"}],\"name\":\"sendMessage\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"sequence\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"tokenServices\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"transferOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"unpause\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"newDestChainId\",\"type\":\"uint256\"}],\"name\":\"updateDestinationChainId\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"newQuorumRequired\",\"type\":\"uint256\"}],\"name\":\"updateQuorum\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newImplementation\",\"type\":\"address\"}],\"name\":\"upgradeTo\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newImplementation\",\"type\":\"address\"},{\"internalType\":\"bytes\",\"name\":\"data\",\"type\":\"bytes\"}],\"name\":\"upgradeToAndCall\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"name\":\"validateAleoAddress\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"pure\",\"type\":\"function\"}]",
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

// ConsumedPackets is a free data retrieval call binding the contract method 0x011f2b28.
//
// Solidity: function consumedPackets(uint256 ) view returns(bytes32)
func (_Bridge *BridgeCaller) ConsumedPackets(opts *bind.CallOpts, arg0 *big.Int) ([32]byte, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "consumedPackets", arg0)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// ConsumedPackets is a free data retrieval call binding the contract method 0x011f2b28.
//
// Solidity: function consumedPackets(uint256 ) view returns(bytes32)
func (_Bridge *BridgeSession) ConsumedPackets(arg0 *big.Int) ([32]byte, error) {
	return _Bridge.Contract.ConsumedPackets(&_Bridge.CallOpts, arg0)
}

// ConsumedPackets is a free data retrieval call binding the contract method 0x011f2b28.
//
// Solidity: function consumedPackets(uint256 ) view returns(bytes32)
func (_Bridge *BridgeCallerSession) ConsumedPackets(arg0 *big.Int) ([32]byte, error) {
	return _Bridge.Contract.ConsumedPackets(&_Bridge.CallOpts, arg0)
}

// DestinationChainId is a free data retrieval call binding the contract method 0xb0750611.
//
// Solidity: function destinationChainId() view returns(uint256)
func (_Bridge *BridgeCaller) DestinationChainId(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "destinationChainId")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// DestinationChainId is a free data retrieval call binding the contract method 0xb0750611.
//
// Solidity: function destinationChainId() view returns(uint256)
func (_Bridge *BridgeSession) DestinationChainId() (*big.Int, error) {
	return _Bridge.Contract.DestinationChainId(&_Bridge.CallOpts)
}

// DestinationChainId is a free data retrieval call binding the contract method 0xb0750611.
//
// Solidity: function destinationChainId() view returns(uint256)
func (_Bridge *BridgeCallerSession) DestinationChainId() (*big.Int, error) {
	return _Bridge.Contract.DestinationChainId(&_Bridge.CallOpts)
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

// IsPacketConsumed is a free data retrieval call binding the contract method 0x25bddae1.
//
// Solidity: function isPacketConsumed(uint256 _sequence) view returns(bool)
func (_Bridge *BridgeCaller) IsPacketConsumed(opts *bind.CallOpts, _sequence *big.Int) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "isPacketConsumed", _sequence)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsPacketConsumed is a free data retrieval call binding the contract method 0x25bddae1.
//
// Solidity: function isPacketConsumed(uint256 _sequence) view returns(bool)
func (_Bridge *BridgeSession) IsPacketConsumed(_sequence *big.Int) (bool, error) {
	return _Bridge.Contract.IsPacketConsumed(&_Bridge.CallOpts, _sequence)
}

// IsPacketConsumed is a free data retrieval call binding the contract method 0x25bddae1.
//
// Solidity: function isPacketConsumed(uint256 _sequence) view returns(bool)
func (_Bridge *BridgeCallerSession) IsPacketConsumed(_sequence *big.Int) (bool, error) {
	return _Bridge.Contract.IsPacketConsumed(&_Bridge.CallOpts, _sequence)
}

// IsRegisteredTokenService is a free data retrieval call binding the contract method 0x6b3da26f.
//
// Solidity: function isRegisteredTokenService(address _service) view returns(bool)
func (_Bridge *BridgeCaller) IsRegisteredTokenService(opts *bind.CallOpts, _service common.Address) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "isRegisteredTokenService", _service)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsRegisteredTokenService is a free data retrieval call binding the contract method 0x6b3da26f.
//
// Solidity: function isRegisteredTokenService(address _service) view returns(bool)
func (_Bridge *BridgeSession) IsRegisteredTokenService(_service common.Address) (bool, error) {
	return _Bridge.Contract.IsRegisteredTokenService(&_Bridge.CallOpts, _service)
}

// IsRegisteredTokenService is a free data retrieval call binding the contract method 0x6b3da26f.
//
// Solidity: function isRegisteredTokenService(address _service) view returns(bool)
func (_Bridge *BridgeCallerSession) IsRegisteredTokenService(_service common.Address) (bool, error) {
	return _Bridge.Contract.IsRegisteredTokenService(&_Bridge.CallOpts, _service)
}

// IsSupportedChain is a free data retrieval call binding the contract method 0x5153d467.
//
// Solidity: function isSupportedChain(uint256 destChainId) view returns(bool)
func (_Bridge *BridgeCaller) IsSupportedChain(opts *bind.CallOpts, destChainId *big.Int) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "isSupportedChain", destChainId)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsSupportedChain is a free data retrieval call binding the contract method 0x5153d467.
//
// Solidity: function isSupportedChain(uint256 destChainId) view returns(bool)
func (_Bridge *BridgeSession) IsSupportedChain(destChainId *big.Int) (bool, error) {
	return _Bridge.Contract.IsSupportedChain(&_Bridge.CallOpts, destChainId)
}

// IsSupportedChain is a free data retrieval call binding the contract method 0x5153d467.
//
// Solidity: function isSupportedChain(uint256 destChainId) view returns(bool)
func (_Bridge *BridgeCallerSession) IsSupportedChain(destChainId *big.Int) (bool, error) {
	return _Bridge.Contract.IsSupportedChain(&_Bridge.CallOpts, destChainId)
}

// OutgoingPackets is a free data retrieval call binding the contract method 0x759f0299.
//
// Solidity: function outgoingPackets(uint256 ) view returns(bytes32)
func (_Bridge *BridgeCaller) OutgoingPackets(opts *bind.CallOpts, arg0 *big.Int) ([32]byte, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "outgoingPackets", arg0)

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// OutgoingPackets is a free data retrieval call binding the contract method 0x759f0299.
//
// Solidity: function outgoingPackets(uint256 ) view returns(bytes32)
func (_Bridge *BridgeSession) OutgoingPackets(arg0 *big.Int) ([32]byte, error) {
	return _Bridge.Contract.OutgoingPackets(&_Bridge.CallOpts, arg0)
}

// OutgoingPackets is a free data retrieval call binding the contract method 0x759f0299.
//
// Solidity: function outgoingPackets(uint256 ) view returns(bytes32)
func (_Bridge *BridgeCallerSession) OutgoingPackets(arg0 *big.Int) ([32]byte, error) {
	return _Bridge.Contract.OutgoingPackets(&_Bridge.CallOpts, arg0)
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

// Paused is a free data retrieval call binding the contract method 0x5c975abb.
//
// Solidity: function paused() view returns(bool)
func (_Bridge *BridgeCaller) Paused(opts *bind.CallOpts) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "paused")

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// Paused is a free data retrieval call binding the contract method 0x5c975abb.
//
// Solidity: function paused() view returns(bool)
func (_Bridge *BridgeSession) Paused() (bool, error) {
	return _Bridge.Contract.Paused(&_Bridge.CallOpts)
}

// Paused is a free data retrieval call binding the contract method 0x5c975abb.
//
// Solidity: function paused() view returns(bool)
func (_Bridge *BridgeCallerSession) Paused() (bool, error) {
	return _Bridge.Contract.Paused(&_Bridge.CallOpts)
}

// ProxiableUUID is a free data retrieval call binding the contract method 0x52d1902d.
//
// Solidity: function proxiableUUID() view returns(bytes32)
func (_Bridge *BridgeCaller) ProxiableUUID(opts *bind.CallOpts) ([32]byte, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "proxiableUUID")

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// ProxiableUUID is a free data retrieval call binding the contract method 0x52d1902d.
//
// Solidity: function proxiableUUID() view returns(bytes32)
func (_Bridge *BridgeSession) ProxiableUUID() ([32]byte, error) {
	return _Bridge.Contract.ProxiableUUID(&_Bridge.CallOpts)
}

// ProxiableUUID is a free data retrieval call binding the contract method 0x52d1902d.
//
// Solidity: function proxiableUUID() view returns(bytes32)
func (_Bridge *BridgeCallerSession) ProxiableUUID() ([32]byte, error) {
	return _Bridge.Contract.ProxiableUUID(&_Bridge.CallOpts)
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

// Sequence is a free data retrieval call binding the contract method 0x529d15cc.
//
// Solidity: function sequence() view returns(uint256)
func (_Bridge *BridgeCaller) Sequence(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "sequence")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// Sequence is a free data retrieval call binding the contract method 0x529d15cc.
//
// Solidity: function sequence() view returns(uint256)
func (_Bridge *BridgeSession) Sequence() (*big.Int, error) {
	return _Bridge.Contract.Sequence(&_Bridge.CallOpts)
}

// Sequence is a free data retrieval call binding the contract method 0x529d15cc.
//
// Solidity: function sequence() view returns(uint256)
func (_Bridge *BridgeCallerSession) Sequence() (*big.Int, error) {
	return _Bridge.Contract.Sequence(&_Bridge.CallOpts)
}

// TokenServices is a free data retrieval call binding the contract method 0x12abc1b9.
//
// Solidity: function tokenServices(address ) view returns(bool)
func (_Bridge *BridgeCaller) TokenServices(opts *bind.CallOpts, arg0 common.Address) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "tokenServices", arg0)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// TokenServices is a free data retrieval call binding the contract method 0x12abc1b9.
//
// Solidity: function tokenServices(address ) view returns(bool)
func (_Bridge *BridgeSession) TokenServices(arg0 common.Address) (bool, error) {
	return _Bridge.Contract.TokenServices(&_Bridge.CallOpts, arg0)
}

// TokenServices is a free data retrieval call binding the contract method 0x12abc1b9.
//
// Solidity: function tokenServices(address ) view returns(bool)
func (_Bridge *BridgeCallerSession) TokenServices(arg0 common.Address) (bool, error) {
	return _Bridge.Contract.TokenServices(&_Bridge.CallOpts, arg0)
}

// ValidateAleoAddress is a free data retrieval call binding the contract method 0x79d0705e.
//
// Solidity: function validateAleoAddress(string addr) pure returns(bool)
func (_Bridge *BridgeCaller) ValidateAleoAddress(opts *bind.CallOpts, addr string) (bool, error) {
	var out []interface{}
	err := _Bridge.contract.Call(opts, &out, "validateAleoAddress", addr)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// ValidateAleoAddress is a free data retrieval call binding the contract method 0x79d0705e.
//
// Solidity: function validateAleoAddress(string addr) pure returns(bool)
func (_Bridge *BridgeSession) ValidateAleoAddress(addr string) (bool, error) {
	return _Bridge.Contract.ValidateAleoAddress(&_Bridge.CallOpts, addr)
}

// ValidateAleoAddress is a free data retrieval call binding the contract method 0x79d0705e.
//
// Solidity: function validateAleoAddress(string addr) pure returns(bool)
func (_Bridge *BridgeCallerSession) ValidateAleoAddress(addr string) (bool, error) {
	return _Bridge.Contract.ValidateAleoAddress(&_Bridge.CallOpts, addr)
}

// BridgeInit is a paid mutator transaction binding the contract method 0x49427c55.
//
// Solidity: function Bridge_init(uint256 _destChainId, address _owner) returns()
func (_Bridge *BridgeTransactor) BridgeInit(opts *bind.TransactOpts, _destChainId *big.Int, _owner common.Address) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "Bridge_init", _destChainId, _owner)
}

// BridgeInit is a paid mutator transaction binding the contract method 0x49427c55.
//
// Solidity: function Bridge_init(uint256 _destChainId, address _owner) returns()
func (_Bridge *BridgeSession) BridgeInit(_destChainId *big.Int, _owner common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.BridgeInit(&_Bridge.TransactOpts, _destChainId, _owner)
}

// BridgeInit is a paid mutator transaction binding the contract method 0x49427c55.
//
// Solidity: function Bridge_init(uint256 _destChainId, address _owner) returns()
func (_Bridge *BridgeTransactorSession) BridgeInit(_destChainId *big.Int, _owner common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.BridgeInit(&_Bridge.TransactOpts, _destChainId, _owner)
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

// AddAttestors is a paid mutator transaction binding the contract method 0x7ce5be0d.
//
// Solidity: function addAttestors(address[] _attestors, uint256 newQuorumRequired) returns()
func (_Bridge *BridgeTransactor) AddAttestors(opts *bind.TransactOpts, _attestors []common.Address, newQuorumRequired *big.Int) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "addAttestors", _attestors, newQuorumRequired)
}

// AddAttestors is a paid mutator transaction binding the contract method 0x7ce5be0d.
//
// Solidity: function addAttestors(address[] _attestors, uint256 newQuorumRequired) returns()
func (_Bridge *BridgeSession) AddAttestors(_attestors []common.Address, newQuorumRequired *big.Int) (*types.Transaction, error) {
	return _Bridge.Contract.AddAttestors(&_Bridge.TransactOpts, _attestors, newQuorumRequired)
}

// AddAttestors is a paid mutator transaction binding the contract method 0x7ce5be0d.
//
// Solidity: function addAttestors(address[] _attestors, uint256 newQuorumRequired) returns()
func (_Bridge *BridgeTransactorSession) AddAttestors(_attestors []common.Address, newQuorumRequired *big.Int) (*types.Transaction, error) {
	return _Bridge.Contract.AddAttestors(&_Bridge.TransactOpts, _attestors, newQuorumRequired)
}

// AddTokenService is a paid mutator transaction binding the contract method 0xf78dd84d.
//
// Solidity: function addTokenService(address _service) returns()
func (_Bridge *BridgeTransactor) AddTokenService(opts *bind.TransactOpts, _service common.Address) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "addTokenService", _service)
}

// AddTokenService is a paid mutator transaction binding the contract method 0xf78dd84d.
//
// Solidity: function addTokenService(address _service) returns()
func (_Bridge *BridgeSession) AddTokenService(_service common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.AddTokenService(&_Bridge.TransactOpts, _service)
}

// AddTokenService is a paid mutator transaction binding the contract method 0xf78dd84d.
//
// Solidity: function addTokenService(address _service) returns()
func (_Bridge *BridgeTransactorSession) AddTokenService(_service common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.AddTokenService(&_Bridge.TransactOpts, _service)
}

// Consume is a paid mutator transaction binding the contract method 0x97067823.
//
// Solidity: function consume((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet, bytes signatures) returns(uint8)
func (_Bridge *BridgeTransactor) Consume(opts *bind.TransactOpts, packet PacketLibraryInPacket, signatures []byte) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "consume", packet, signatures)
}

// Consume is a paid mutator transaction binding the contract method 0x97067823.
//
// Solidity: function consume((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet, bytes signatures) returns(uint8)
func (_Bridge *BridgeSession) Consume(packet PacketLibraryInPacket, signatures []byte) (*types.Transaction, error) {
	return _Bridge.Contract.Consume(&_Bridge.TransactOpts, packet, signatures)
}

// Consume is a paid mutator transaction binding the contract method 0x97067823.
//
// Solidity: function consume((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet, bytes signatures) returns(uint8)
func (_Bridge *BridgeTransactorSession) Consume(packet PacketLibraryInPacket, signatures []byte) (*types.Transaction, error) {
	return _Bridge.Contract.Consume(&_Bridge.TransactOpts, packet, signatures)
}

// Pause is a paid mutator transaction binding the contract method 0x8456cb59.
//
// Solidity: function pause() returns()
func (_Bridge *BridgeTransactor) Pause(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "pause")
}

// Pause is a paid mutator transaction binding the contract method 0x8456cb59.
//
// Solidity: function pause() returns()
func (_Bridge *BridgeSession) Pause() (*types.Transaction, error) {
	return _Bridge.Contract.Pause(&_Bridge.TransactOpts)
}

// Pause is a paid mutator transaction binding the contract method 0x8456cb59.
//
// Solidity: function pause() returns()
func (_Bridge *BridgeTransactorSession) Pause() (*types.Transaction, error) {
	return _Bridge.Contract.Pause(&_Bridge.TransactOpts)
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

// RemoveTokenService is a paid mutator transaction binding the contract method 0x05cd5a36.
//
// Solidity: function removeTokenService(address _service) returns()
func (_Bridge *BridgeTransactor) RemoveTokenService(opts *bind.TransactOpts, _service common.Address) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "removeTokenService", _service)
}

// RemoveTokenService is a paid mutator transaction binding the contract method 0x05cd5a36.
//
// Solidity: function removeTokenService(address _service) returns()
func (_Bridge *BridgeSession) RemoveTokenService(_service common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.RemoveTokenService(&_Bridge.TransactOpts, _service)
}

// RemoveTokenService is a paid mutator transaction binding the contract method 0x05cd5a36.
//
// Solidity: function removeTokenService(address _service) returns()
func (_Bridge *BridgeTransactorSession) RemoveTokenService(_service common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.RemoveTokenService(&_Bridge.TransactOpts, _service)
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_Bridge *BridgeTransactor) RenounceOwnership(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "renounceOwnership")
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_Bridge *BridgeSession) RenounceOwnership() (*types.Transaction, error) {
	return _Bridge.Contract.RenounceOwnership(&_Bridge.TransactOpts)
}

// RenounceOwnership is a paid mutator transaction binding the contract method 0x715018a6.
//
// Solidity: function renounceOwnership() returns()
func (_Bridge *BridgeTransactorSession) RenounceOwnership() (*types.Transaction, error) {
	return _Bridge.Contract.RenounceOwnership(&_Bridge.TransactOpts)
}

// SendMessage is a paid mutator transaction binding the contract method 0x6d1eaa88.
//
// Solidity: function sendMessage((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256) packet, bytes data) returns()
func (_Bridge *BridgeTransactor) SendMessage(opts *bind.TransactOpts, packet PacketLibraryOutPacket, data []byte) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "sendMessage", packet, data)
}

// SendMessage is a paid mutator transaction binding the contract method 0x6d1eaa88.
//
// Solidity: function sendMessage((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256) packet, bytes data) returns()
func (_Bridge *BridgeSession) SendMessage(packet PacketLibraryOutPacket, data []byte) (*types.Transaction, error) {
	return _Bridge.Contract.SendMessage(&_Bridge.TransactOpts, packet, data)
}

// SendMessage is a paid mutator transaction binding the contract method 0x6d1eaa88.
//
// Solidity: function sendMessage((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256) packet, bytes data) returns()
func (_Bridge *BridgeTransactorSession) SendMessage(packet PacketLibraryOutPacket, data []byte) (*types.Transaction, error) {
	return _Bridge.Contract.SendMessage(&_Bridge.TransactOpts, packet, data)
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

// Unpause is a paid mutator transaction binding the contract method 0x3f4ba83a.
//
// Solidity: function unpause() returns()
func (_Bridge *BridgeTransactor) Unpause(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "unpause")
}

// Unpause is a paid mutator transaction binding the contract method 0x3f4ba83a.
//
// Solidity: function unpause() returns()
func (_Bridge *BridgeSession) Unpause() (*types.Transaction, error) {
	return _Bridge.Contract.Unpause(&_Bridge.TransactOpts)
}

// Unpause is a paid mutator transaction binding the contract method 0x3f4ba83a.
//
// Solidity: function unpause() returns()
func (_Bridge *BridgeTransactorSession) Unpause() (*types.Transaction, error) {
	return _Bridge.Contract.Unpause(&_Bridge.TransactOpts)
}

// UpdateDestinationChainId is a paid mutator transaction binding the contract method 0xb93429a8.
//
// Solidity: function updateDestinationChainId(uint256 newDestChainId) returns()
func (_Bridge *BridgeTransactor) UpdateDestinationChainId(opts *bind.TransactOpts, newDestChainId *big.Int) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "updateDestinationChainId", newDestChainId)
}

// UpdateDestinationChainId is a paid mutator transaction binding the contract method 0xb93429a8.
//
// Solidity: function updateDestinationChainId(uint256 newDestChainId) returns()
func (_Bridge *BridgeSession) UpdateDestinationChainId(newDestChainId *big.Int) (*types.Transaction, error) {
	return _Bridge.Contract.UpdateDestinationChainId(&_Bridge.TransactOpts, newDestChainId)
}

// UpdateDestinationChainId is a paid mutator transaction binding the contract method 0xb93429a8.
//
// Solidity: function updateDestinationChainId(uint256 newDestChainId) returns()
func (_Bridge *BridgeTransactorSession) UpdateDestinationChainId(newDestChainId *big.Int) (*types.Transaction, error) {
	return _Bridge.Contract.UpdateDestinationChainId(&_Bridge.TransactOpts, newDestChainId)
}

// UpdateQuorum is a paid mutator transaction binding the contract method 0x35680dc2.
//
// Solidity: function updateQuorum(uint256 newQuorumRequired) returns()
func (_Bridge *BridgeTransactor) UpdateQuorum(opts *bind.TransactOpts, newQuorumRequired *big.Int) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "updateQuorum", newQuorumRequired)
}

// UpdateQuorum is a paid mutator transaction binding the contract method 0x35680dc2.
//
// Solidity: function updateQuorum(uint256 newQuorumRequired) returns()
func (_Bridge *BridgeSession) UpdateQuorum(newQuorumRequired *big.Int) (*types.Transaction, error) {
	return _Bridge.Contract.UpdateQuorum(&_Bridge.TransactOpts, newQuorumRequired)
}

// UpdateQuorum is a paid mutator transaction binding the contract method 0x35680dc2.
//
// Solidity: function updateQuorum(uint256 newQuorumRequired) returns()
func (_Bridge *BridgeTransactorSession) UpdateQuorum(newQuorumRequired *big.Int) (*types.Transaction, error) {
	return _Bridge.Contract.UpdateQuorum(&_Bridge.TransactOpts, newQuorumRequired)
}

// UpgradeTo is a paid mutator transaction binding the contract method 0x3659cfe6.
//
// Solidity: function upgradeTo(address newImplementation) returns()
func (_Bridge *BridgeTransactor) UpgradeTo(opts *bind.TransactOpts, newImplementation common.Address) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "upgradeTo", newImplementation)
}

// UpgradeTo is a paid mutator transaction binding the contract method 0x3659cfe6.
//
// Solidity: function upgradeTo(address newImplementation) returns()
func (_Bridge *BridgeSession) UpgradeTo(newImplementation common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.UpgradeTo(&_Bridge.TransactOpts, newImplementation)
}

// UpgradeTo is a paid mutator transaction binding the contract method 0x3659cfe6.
//
// Solidity: function upgradeTo(address newImplementation) returns()
func (_Bridge *BridgeTransactorSession) UpgradeTo(newImplementation common.Address) (*types.Transaction, error) {
	return _Bridge.Contract.UpgradeTo(&_Bridge.TransactOpts, newImplementation)
}

// UpgradeToAndCall is a paid mutator transaction binding the contract method 0x4f1ef286.
//
// Solidity: function upgradeToAndCall(address newImplementation, bytes data) payable returns()
func (_Bridge *BridgeTransactor) UpgradeToAndCall(opts *bind.TransactOpts, newImplementation common.Address, data []byte) (*types.Transaction, error) {
	return _Bridge.contract.Transact(opts, "upgradeToAndCall", newImplementation, data)
}

// UpgradeToAndCall is a paid mutator transaction binding the contract method 0x4f1ef286.
//
// Solidity: function upgradeToAndCall(address newImplementation, bytes data) payable returns()
func (_Bridge *BridgeSession) UpgradeToAndCall(newImplementation common.Address, data []byte) (*types.Transaction, error) {
	return _Bridge.Contract.UpgradeToAndCall(&_Bridge.TransactOpts, newImplementation, data)
}

// UpgradeToAndCall is a paid mutator transaction binding the contract method 0x4f1ef286.
//
// Solidity: function upgradeToAndCall(address newImplementation, bytes data) payable returns()
func (_Bridge *BridgeTransactorSession) UpgradeToAndCall(newImplementation common.Address, data []byte) (*types.Transaction, error) {
	return _Bridge.Contract.UpgradeToAndCall(&_Bridge.TransactOpts, newImplementation, data)
}

// BridgeAdminChangedIterator is returned from FilterAdminChanged and is used to iterate over the raw logs and unpacked data for AdminChanged events raised by the Bridge contract.
type BridgeAdminChangedIterator struct {
	Event *BridgeAdminChanged // Event containing the contract specifics and raw log

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
func (it *BridgeAdminChangedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeAdminChanged)
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
		it.Event = new(BridgeAdminChanged)
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
func (it *BridgeAdminChangedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeAdminChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeAdminChanged represents a AdminChanged event raised by the Bridge contract.
type BridgeAdminChanged struct {
	PreviousAdmin common.Address
	NewAdmin      common.Address
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterAdminChanged is a free log retrieval operation binding the contract event 0x7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f.
//
// Solidity: event AdminChanged(address previousAdmin, address newAdmin)
func (_Bridge *BridgeFilterer) FilterAdminChanged(opts *bind.FilterOpts) (*BridgeAdminChangedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "AdminChanged")
	if err != nil {
		return nil, err
	}
	return &BridgeAdminChangedIterator{contract: _Bridge.contract, event: "AdminChanged", logs: logs, sub: sub}, nil
}

// WatchAdminChanged is a free log subscription operation binding the contract event 0x7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f.
//
// Solidity: event AdminChanged(address previousAdmin, address newAdmin)
func (_Bridge *BridgeFilterer) WatchAdminChanged(opts *bind.WatchOpts, sink chan<- *BridgeAdminChanged) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "AdminChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeAdminChanged)
				if err := _Bridge.contract.UnpackLog(event, "AdminChanged", log); err != nil {
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

// ParseAdminChanged is a log parse operation binding the contract event 0x7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f.
//
// Solidity: event AdminChanged(address previousAdmin, address newAdmin)
func (_Bridge *BridgeFilterer) ParseAdminChanged(log types.Log) (*BridgeAdminChanged, error) {
	event := new(BridgeAdminChanged)
	if err := _Bridge.contract.UnpackLog(event, "AdminChanged", log); err != nil {
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
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterAttestorAdded is a free log retrieval operation binding the contract event 0x945c4a21d3fce955d17e31fcc471734b3d754c032b3805b02fe75d89c29b2a3a.
//
// Solidity: event AttestorAdded(address indexed attestor)
func (_Bridge *BridgeFilterer) FilterAttestorAdded(opts *bind.FilterOpts, attestor []common.Address) (*BridgeAttestorAddedIterator, error) {

	var attestorRule []interface{}
	for _, attestorItem := range attestor {
		attestorRule = append(attestorRule, attestorItem)
	}

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "AttestorAdded", attestorRule)
	if err != nil {
		return nil, err
	}
	return &BridgeAttestorAddedIterator{contract: _Bridge.contract, event: "AttestorAdded", logs: logs, sub: sub}, nil
}

// WatchAttestorAdded is a free log subscription operation binding the contract event 0x945c4a21d3fce955d17e31fcc471734b3d754c032b3805b02fe75d89c29b2a3a.
//
// Solidity: event AttestorAdded(address indexed attestor)
func (_Bridge *BridgeFilterer) WatchAttestorAdded(opts *bind.WatchOpts, sink chan<- *BridgeAttestorAdded, attestor []common.Address) (event.Subscription, error) {

	var attestorRule []interface{}
	for _, attestorItem := range attestor {
		attestorRule = append(attestorRule, attestorItem)
	}

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "AttestorAdded", attestorRule)
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

// ParseAttestorAdded is a log parse operation binding the contract event 0x945c4a21d3fce955d17e31fcc471734b3d754c032b3805b02fe75d89c29b2a3a.
//
// Solidity: event AttestorAdded(address indexed attestor)
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
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterAttestorRemoved is a free log retrieval operation binding the contract event 0x7b1e5155c9ac76eaa3c56fcf63a3383cd696a6fa84c49901c7ae374c0a508612.
//
// Solidity: event AttestorRemoved(address indexed attestor)
func (_Bridge *BridgeFilterer) FilterAttestorRemoved(opts *bind.FilterOpts, attestor []common.Address) (*BridgeAttestorRemovedIterator, error) {

	var attestorRule []interface{}
	for _, attestorItem := range attestor {
		attestorRule = append(attestorRule, attestorItem)
	}

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "AttestorRemoved", attestorRule)
	if err != nil {
		return nil, err
	}
	return &BridgeAttestorRemovedIterator{contract: _Bridge.contract, event: "AttestorRemoved", logs: logs, sub: sub}, nil
}

// WatchAttestorRemoved is a free log subscription operation binding the contract event 0x7b1e5155c9ac76eaa3c56fcf63a3383cd696a6fa84c49901c7ae374c0a508612.
//
// Solidity: event AttestorRemoved(address indexed attestor)
func (_Bridge *BridgeFilterer) WatchAttestorRemoved(opts *bind.WatchOpts, sink chan<- *BridgeAttestorRemoved, attestor []common.Address) (event.Subscription, error) {

	var attestorRule []interface{}
	for _, attestorItem := range attestor {
		attestorRule = append(attestorRule, attestorItem)
	}

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "AttestorRemoved", attestorRule)
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

// ParseAttestorRemoved is a log parse operation binding the contract event 0x7b1e5155c9ac76eaa3c56fcf63a3383cd696a6fa84c49901c7ae374c0a508612.
//
// Solidity: event AttestorRemoved(address indexed attestor)
func (_Bridge *BridgeFilterer) ParseAttestorRemoved(log types.Log) (*BridgeAttestorRemoved, error) {
	event := new(BridgeAttestorRemoved)
	if err := _Bridge.contract.UnpackLog(event, "AttestorRemoved", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeBeaconUpgradedIterator is returned from FilterBeaconUpgraded and is used to iterate over the raw logs and unpacked data for BeaconUpgraded events raised by the Bridge contract.
type BridgeBeaconUpgradedIterator struct {
	Event *BridgeBeaconUpgraded // Event containing the contract specifics and raw log

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
func (it *BridgeBeaconUpgradedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeBeaconUpgraded)
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
		it.Event = new(BridgeBeaconUpgraded)
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
func (it *BridgeBeaconUpgradedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeBeaconUpgradedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeBeaconUpgraded represents a BeaconUpgraded event raised by the Bridge contract.
type BridgeBeaconUpgraded struct {
	Beacon common.Address
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterBeaconUpgraded is a free log retrieval operation binding the contract event 0x1cf3b03a6cf19fa2baba4df148e9dcabedea7f8a5c07840e207e5c089be95d3e.
//
// Solidity: event BeaconUpgraded(address indexed beacon)
func (_Bridge *BridgeFilterer) FilterBeaconUpgraded(opts *bind.FilterOpts, beacon []common.Address) (*BridgeBeaconUpgradedIterator, error) {

	var beaconRule []interface{}
	for _, beaconItem := range beacon {
		beaconRule = append(beaconRule, beaconItem)
	}

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "BeaconUpgraded", beaconRule)
	if err != nil {
		return nil, err
	}
	return &BridgeBeaconUpgradedIterator{contract: _Bridge.contract, event: "BeaconUpgraded", logs: logs, sub: sub}, nil
}

// WatchBeaconUpgraded is a free log subscription operation binding the contract event 0x1cf3b03a6cf19fa2baba4df148e9dcabedea7f8a5c07840e207e5c089be95d3e.
//
// Solidity: event BeaconUpgraded(address indexed beacon)
func (_Bridge *BridgeFilterer) WatchBeaconUpgraded(opts *bind.WatchOpts, sink chan<- *BridgeBeaconUpgraded, beacon []common.Address) (event.Subscription, error) {

	var beaconRule []interface{}
	for _, beaconItem := range beacon {
		beaconRule = append(beaconRule, beaconItem)
	}

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "BeaconUpgraded", beaconRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeBeaconUpgraded)
				if err := _Bridge.contract.UnpackLog(event, "BeaconUpgraded", log); err != nil {
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

// ParseBeaconUpgraded is a log parse operation binding the contract event 0x1cf3b03a6cf19fa2baba4df148e9dcabedea7f8a5c07840e207e5c089be95d3e.
//
// Solidity: event BeaconUpgraded(address indexed beacon)
func (_Bridge *BridgeFilterer) ParseBeaconUpgraded(log types.Log) (*BridgeBeaconUpgraded, error) {
	event := new(BridgeBeaconUpgraded)
	if err := _Bridge.contract.UnpackLog(event, "BeaconUpgraded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeChainUpdatedIterator is returned from FilterChainUpdated and is used to iterate over the raw logs and unpacked data for ChainUpdated events raised by the Bridge contract.
type BridgeChainUpdatedIterator struct {
	Event *BridgeChainUpdated // Event containing the contract specifics and raw log

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
func (it *BridgeChainUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeChainUpdated)
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
		it.Event = new(BridgeChainUpdated)
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
func (it *BridgeChainUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeChainUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeChainUpdated represents a ChainUpdated event raised by the Bridge contract.
type BridgeChainUpdated struct {
	OldDestinationChainId *big.Int
	NewDestinationChainId *big.Int
	Raw                   types.Log // Blockchain specific contextual infos
}

// FilterChainUpdated is a free log retrieval operation binding the contract event 0xb6fa2f2ef6dbc76619532f8a9afc075b44c8b0464fec94b57e91eaa478d177f5.
//
// Solidity: event ChainUpdated(uint256 oldDestinationChainId, uint256 newDestinationChainId)
func (_Bridge *BridgeFilterer) FilterChainUpdated(opts *bind.FilterOpts) (*BridgeChainUpdatedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "ChainUpdated")
	if err != nil {
		return nil, err
	}
	return &BridgeChainUpdatedIterator{contract: _Bridge.contract, event: "ChainUpdated", logs: logs, sub: sub}, nil
}

// WatchChainUpdated is a free log subscription operation binding the contract event 0xb6fa2f2ef6dbc76619532f8a9afc075b44c8b0464fec94b57e91eaa478d177f5.
//
// Solidity: event ChainUpdated(uint256 oldDestinationChainId, uint256 newDestinationChainId)
func (_Bridge *BridgeFilterer) WatchChainUpdated(opts *bind.WatchOpts, sink chan<- *BridgeChainUpdated) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "ChainUpdated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeChainUpdated)
				if err := _Bridge.contract.UnpackLog(event, "ChainUpdated", log); err != nil {
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

// ParseChainUpdated is a log parse operation binding the contract event 0xb6fa2f2ef6dbc76619532f8a9afc075b44c8b0464fec94b57e91eaa478d177f5.
//
// Solidity: event ChainUpdated(uint256 oldDestinationChainId, uint256 newDestinationChainId)
func (_Bridge *BridgeFilterer) ParseChainUpdated(log types.Log) (*BridgeChainUpdated, error) {
	event := new(BridgeChainUpdated)
	if err := _Bridge.contract.UnpackLog(event, "ChainUpdated", log); err != nil {
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
	Quorum     uint8
	Raw        types.Log // Blockchain specific contextual infos
}

// FilterConsumed is a free log retrieval operation binding the contract event 0x34becda61bb85f635633727b86333631320ead15d08be6dc1e8049014f0da149.
//
// Solidity: event Consumed(uint256 chainId, uint256 sequence, bytes32 packetHash, uint8 _quorum)
func (_Bridge *BridgeFilterer) FilterConsumed(opts *bind.FilterOpts) (*BridgeConsumedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "Consumed")
	if err != nil {
		return nil, err
	}
	return &BridgeConsumedIterator{contract: _Bridge.contract, event: "Consumed", logs: logs, sub: sub}, nil
}

// WatchConsumed is a free log subscription operation binding the contract event 0x34becda61bb85f635633727b86333631320ead15d08be6dc1e8049014f0da149.
//
// Solidity: event Consumed(uint256 chainId, uint256 sequence, bytes32 packetHash, uint8 _quorum)
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

// ParseConsumed is a log parse operation binding the contract event 0x34becda61bb85f635633727b86333631320ead15d08be6dc1e8049014f0da149.
//
// Solidity: event Consumed(uint256 chainId, uint256 sequence, bytes32 packetHash, uint8 _quorum)
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

// BridgeOwnershipTransferredIterator is returned from FilterOwnershipTransferred and is used to iterate over the raw logs and unpacked data for OwnershipTransferred events raised by the Bridge contract.
type BridgeOwnershipTransferredIterator struct {
	Event *BridgeOwnershipTransferred // Event containing the contract specifics and raw log

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
func (it *BridgeOwnershipTransferredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeOwnershipTransferred)
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
		it.Event = new(BridgeOwnershipTransferred)
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
func (it *BridgeOwnershipTransferredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeOwnershipTransferredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeOwnershipTransferred represents a OwnershipTransferred event raised by the Bridge contract.
type BridgeOwnershipTransferred struct {
	PreviousOwner common.Address
	NewOwner      common.Address
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterOwnershipTransferred is a free log retrieval operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_Bridge *BridgeFilterer) FilterOwnershipTransferred(opts *bind.FilterOpts, previousOwner []common.Address, newOwner []common.Address) (*BridgeOwnershipTransferredIterator, error) {

	var previousOwnerRule []interface{}
	for _, previousOwnerItem := range previousOwner {
		previousOwnerRule = append(previousOwnerRule, previousOwnerItem)
	}
	var newOwnerRule []interface{}
	for _, newOwnerItem := range newOwner {
		newOwnerRule = append(newOwnerRule, newOwnerItem)
	}

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "OwnershipTransferred", previousOwnerRule, newOwnerRule)
	if err != nil {
		return nil, err
	}
	return &BridgeOwnershipTransferredIterator{contract: _Bridge.contract, event: "OwnershipTransferred", logs: logs, sub: sub}, nil
}

// WatchOwnershipTransferred is a free log subscription operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_Bridge *BridgeFilterer) WatchOwnershipTransferred(opts *bind.WatchOpts, sink chan<- *BridgeOwnershipTransferred, previousOwner []common.Address, newOwner []common.Address) (event.Subscription, error) {

	var previousOwnerRule []interface{}
	for _, previousOwnerItem := range previousOwner {
		previousOwnerRule = append(previousOwnerRule, previousOwnerItem)
	}
	var newOwnerRule []interface{}
	for _, newOwnerItem := range newOwner {
		newOwnerRule = append(newOwnerRule, newOwnerItem)
	}

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "OwnershipTransferred", previousOwnerRule, newOwnerRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeOwnershipTransferred)
				if err := _Bridge.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
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

// ParseOwnershipTransferred is a log parse operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
func (_Bridge *BridgeFilterer) ParseOwnershipTransferred(log types.Log) (*BridgeOwnershipTransferred, error) {
	event := new(BridgeOwnershipTransferred)
	if err := _Bridge.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
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
	Data   []byte
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterPacketDispatched is a free log retrieval operation binding the contract event 0x2ea0473a63d92d3182c86a6f05d1984a63782c7c58f5d32bb629fdf43388c1b0.
//
// Solidity: event PacketDispatched((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256) packet, bytes data)
func (_Bridge *BridgeFilterer) FilterPacketDispatched(opts *bind.FilterOpts) (*BridgePacketDispatchedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "PacketDispatched")
	if err != nil {
		return nil, err
	}
	return &BridgePacketDispatchedIterator{contract: _Bridge.contract, event: "PacketDispatched", logs: logs, sub: sub}, nil
}

// WatchPacketDispatched is a free log subscription operation binding the contract event 0x2ea0473a63d92d3182c86a6f05d1984a63782c7c58f5d32bb629fdf43388c1b0.
//
// Solidity: event PacketDispatched((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256) packet, bytes data)
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

// ParsePacketDispatched is a log parse operation binding the contract event 0x2ea0473a63d92d3182c86a6f05d1984a63782c7c58f5d32bb629fdf43388c1b0.
//
// Solidity: event PacketDispatched((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256) packet, bytes data)
func (_Bridge *BridgeFilterer) ParsePacketDispatched(log types.Log) (*BridgePacketDispatched, error) {
	event := new(BridgePacketDispatched)
	if err := _Bridge.contract.UnpackLog(event, "PacketDispatched", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgePausedIterator is returned from FilterPaused and is used to iterate over the raw logs and unpacked data for Paused events raised by the Bridge contract.
type BridgePausedIterator struct {
	Event *BridgePaused // Event containing the contract specifics and raw log

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
func (it *BridgePausedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgePaused)
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
		it.Event = new(BridgePaused)
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
func (it *BridgePausedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgePausedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgePaused represents a Paused event raised by the Bridge contract.
type BridgePaused struct {
	Account common.Address
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterPaused is a free log retrieval operation binding the contract event 0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258.
//
// Solidity: event Paused(address account)
func (_Bridge *BridgeFilterer) FilterPaused(opts *bind.FilterOpts) (*BridgePausedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "Paused")
	if err != nil {
		return nil, err
	}
	return &BridgePausedIterator{contract: _Bridge.contract, event: "Paused", logs: logs, sub: sub}, nil
}

// WatchPaused is a free log subscription operation binding the contract event 0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258.
//
// Solidity: event Paused(address account)
func (_Bridge *BridgeFilterer) WatchPaused(opts *bind.WatchOpts, sink chan<- *BridgePaused) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "Paused")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgePaused)
				if err := _Bridge.contract.UnpackLog(event, "Paused", log); err != nil {
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

// ParsePaused is a log parse operation binding the contract event 0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258.
//
// Solidity: event Paused(address account)
func (_Bridge *BridgeFilterer) ParsePaused(log types.Log) (*BridgePaused, error) {
	event := new(BridgePaused)
	if err := _Bridge.contract.UnpackLog(event, "Paused", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeQuorumUpdatedIterator is returned from FilterQuorumUpdated and is used to iterate over the raw logs and unpacked data for QuorumUpdated events raised by the Bridge contract.
type BridgeQuorumUpdatedIterator struct {
	Event *BridgeQuorumUpdated // Event containing the contract specifics and raw log

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
func (it *BridgeQuorumUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeQuorumUpdated)
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
		it.Event = new(BridgeQuorumUpdated)
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
func (it *BridgeQuorumUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeQuorumUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeQuorumUpdated represents a QuorumUpdated event raised by the Bridge contract.
type BridgeQuorumUpdated struct {
	OldQuorum *big.Int
	NewQuorum *big.Int
	Raw       types.Log // Blockchain specific contextual infos
}

// FilterQuorumUpdated is a free log retrieval operation binding the contract event 0x6784e9bcb845caaa98267d7b0918f97d3d17f7cb35a05b52010f7eb587a0acb0.
//
// Solidity: event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum)
func (_Bridge *BridgeFilterer) FilterQuorumUpdated(opts *bind.FilterOpts) (*BridgeQuorumUpdatedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "QuorumUpdated")
	if err != nil {
		return nil, err
	}
	return &BridgeQuorumUpdatedIterator{contract: _Bridge.contract, event: "QuorumUpdated", logs: logs, sub: sub}, nil
}

// WatchQuorumUpdated is a free log subscription operation binding the contract event 0x6784e9bcb845caaa98267d7b0918f97d3d17f7cb35a05b52010f7eb587a0acb0.
//
// Solidity: event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum)
func (_Bridge *BridgeFilterer) WatchQuorumUpdated(opts *bind.WatchOpts, sink chan<- *BridgeQuorumUpdated) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "QuorumUpdated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeQuorumUpdated)
				if err := _Bridge.contract.UnpackLog(event, "QuorumUpdated", log); err != nil {
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

// ParseQuorumUpdated is a log parse operation binding the contract event 0x6784e9bcb845caaa98267d7b0918f97d3d17f7cb35a05b52010f7eb587a0acb0.
//
// Solidity: event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum)
func (_Bridge *BridgeFilterer) ParseQuorumUpdated(log types.Log) (*BridgeQuorumUpdated, error) {
	event := new(BridgeQuorumUpdated)
	if err := _Bridge.contract.UnpackLog(event, "QuorumUpdated", log); err != nil {
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

// BridgeUnpausedIterator is returned from FilterUnpaused and is used to iterate over the raw logs and unpacked data for Unpaused events raised by the Bridge contract.
type BridgeUnpausedIterator struct {
	Event *BridgeUnpaused // Event containing the contract specifics and raw log

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
func (it *BridgeUnpausedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeUnpaused)
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
		it.Event = new(BridgeUnpaused)
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
func (it *BridgeUnpausedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeUnpausedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeUnpaused represents a Unpaused event raised by the Bridge contract.
type BridgeUnpaused struct {
	Account common.Address
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterUnpaused is a free log retrieval operation binding the contract event 0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa.
//
// Solidity: event Unpaused(address account)
func (_Bridge *BridgeFilterer) FilterUnpaused(opts *bind.FilterOpts) (*BridgeUnpausedIterator, error) {

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "Unpaused")
	if err != nil {
		return nil, err
	}
	return &BridgeUnpausedIterator{contract: _Bridge.contract, event: "Unpaused", logs: logs, sub: sub}, nil
}

// WatchUnpaused is a free log subscription operation binding the contract event 0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa.
//
// Solidity: event Unpaused(address account)
func (_Bridge *BridgeFilterer) WatchUnpaused(opts *bind.WatchOpts, sink chan<- *BridgeUnpaused) (event.Subscription, error) {

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "Unpaused")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeUnpaused)
				if err := _Bridge.contract.UnpackLog(event, "Unpaused", log); err != nil {
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

// ParseUnpaused is a log parse operation binding the contract event 0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa.
//
// Solidity: event Unpaused(address account)
func (_Bridge *BridgeFilterer) ParseUnpaused(log types.Log) (*BridgeUnpaused, error) {
	event := new(BridgeUnpaused)
	if err := _Bridge.contract.UnpackLog(event, "Unpaused", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// BridgeUpgradedIterator is returned from FilterUpgraded and is used to iterate over the raw logs and unpacked data for Upgraded events raised by the Bridge contract.
type BridgeUpgradedIterator struct {
	Event *BridgeUpgraded // Event containing the contract specifics and raw log

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
func (it *BridgeUpgradedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(BridgeUpgraded)
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
		it.Event = new(BridgeUpgraded)
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
func (it *BridgeUpgradedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *BridgeUpgradedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// BridgeUpgraded represents a Upgraded event raised by the Bridge contract.
type BridgeUpgraded struct {
	Implementation common.Address
	Raw            types.Log // Blockchain specific contextual infos
}

// FilterUpgraded is a free log retrieval operation binding the contract event 0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b.
//
// Solidity: event Upgraded(address indexed implementation)
func (_Bridge *BridgeFilterer) FilterUpgraded(opts *bind.FilterOpts, implementation []common.Address) (*BridgeUpgradedIterator, error) {

	var implementationRule []interface{}
	for _, implementationItem := range implementation {
		implementationRule = append(implementationRule, implementationItem)
	}

	logs, sub, err := _Bridge.contract.FilterLogs(opts, "Upgraded", implementationRule)
	if err != nil {
		return nil, err
	}
	return &BridgeUpgradedIterator{contract: _Bridge.contract, event: "Upgraded", logs: logs, sub: sub}, nil
}

// WatchUpgraded is a free log subscription operation binding the contract event 0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b.
//
// Solidity: event Upgraded(address indexed implementation)
func (_Bridge *BridgeFilterer) WatchUpgraded(opts *bind.WatchOpts, sink chan<- *BridgeUpgraded, implementation []common.Address) (event.Subscription, error) {

	var implementationRule []interface{}
	for _, implementationItem := range implementation {
		implementationRule = append(implementationRule, implementationItem)
	}

	logs, sub, err := _Bridge.contract.WatchLogs(opts, "Upgraded", implementationRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(BridgeUpgraded)
				if err := _Bridge.contract.UnpackLog(event, "Upgraded", log); err != nil {
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

// ParseUpgraded is a log parse operation binding the contract event 0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b.
//
// Solidity: event Upgraded(address indexed implementation)
func (_Bridge *BridgeFilterer) ParseUpgraded(log types.Log) (*BridgeUpgraded, error) {
	event := new(BridgeUpgraded)
	if err := _Bridge.contract.UnpackLog(event, "Upgraded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
