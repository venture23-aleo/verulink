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



// TokenSupportToken is an auto generated low-level Go binding around an user-defined struct.
type TokenSupportToken struct {
	TokenAddress     common.Address
	Vault            common.Address
	DestTokenAddress string
	DestTokenService string
	MinValue         *big.Int
	MaxValue         *big.Int
	Enabled          bool
}

// TokenServiceMetaData contains all meta data concerning the TokenService contract.
var TokenServiceMetaData = &bind.MetaData{
	ABI: "[{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"previousAdmin\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"newAdmin\",\"type\":\"address\"}],\"name\":\"AdminChanged\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"beacon\",\"type\":\"address\"}],\"name\":\"BeaconUpgraded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"uint8\",\"name\":\"version\",\"type\":\"uint8\"}],\"name\":\"Initialized\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"oldOwner\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"OwnershipTransferred\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[],\"name\":\"Pause\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"internalType\":\"contractIVaultService\",\"name\":\"vault\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"destTokenAddress\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"destTokenService\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"minValue\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"maxValue\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"enabled\",\"type\":\"bool\"}],\"indexed\":false,\"internalType\":\"structTokenSupport.Token\",\"name\":\"token\",\"type\":\"tuple\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"destChainId\",\"type\":\"uint256\"}],\"name\":\"TokenAdded\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"destChainId\",\"type\":\"uint256\"}],\"name\":\"TokenDisabled\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"destChainId\",\"type\":\"uint256\"}],\"name\":\"TokenEnabled\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"destChainId\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"oldMaxValue\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newMaxValue\",\"type\":\"uint256\"}],\"name\":\"TokenMaxValueUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"destChainId\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"oldMinValue\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"newMinValue\",\"type\":\"uint256\"}],\"name\":\"TokenMinValueUpdated\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"destChainId\",\"type\":\"uint256\"}],\"name\":\"TokenRemoved\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[],\"name\":\"Unpause\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"implementation\",\"type\":\"address\"}],\"name\":\"Upgraded\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_destChainId\",\"type\":\"uint256\"}],\"name\":\"_initialize\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_destChainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"vault\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"destTokenAddress\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"destTokenService\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"min\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"max\",\"type\":\"uint256\"}],\"name\":\"addToken\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"destChainId\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_destChainId\",\"type\":\"uint256\"}],\"name\":\"disable\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_destChainId\",\"type\":\"uint256\"}],\"name\":\"enable\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"bridge\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_chainId\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"_destChainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"_owner\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"_blackListService\",\"type\":\"address\"}],\"name\":\"initialize\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"isAmountInRange\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"}],\"name\":\"isEnabledToken\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"}],\"name\":\"isSupportedToken\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"owner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"pause\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"paused\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"proxiableUUID\",\"outputs\":[{\"internalType\":\"bytes32\",\"name\":\"\",\"type\":\"bytes32\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"_destChainId\",\"type\":\"uint256\"}],\"name\":\"removeToken\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"self\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"contractHolding\",\"name\":\"_holding\",\"type\":\"address\"}],\"name\":\"setHolding\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"supportedTokens\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"internalType\":\"contractIVaultService\",\"name\":\"vault\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"destTokenAddress\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"destTokenService\",\"type\":\"string\"},{\"internalType\":\"uint256\",\"name\":\"minValue\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"maxValue\",\"type\":\"uint256\"},{\"internalType\":\"bool\",\"name\":\"enabled\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"tokenType\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"pure\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"receiver\",\"type\":\"string\"}],\"name\":\"transfer\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"string\",\"name\":\"receiver\",\"type\":\"string\"}],\"name\":\"transfer\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"transferOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"token\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"transferToVault\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"unpause\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"maxValue\",\"type\":\"uint256\"}],\"name\":\"updateMaxValue\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"tokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"minValue\",\"type\":\"uint256\"}],\"name\":\"updateMinValue\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newImplementation\",\"type\":\"address\"}],\"name\":\"upgradeTo\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newImplementation\",\"type\":\"address\"},{\"internalType\":\"bytes\",\"name\":\"data\",\"type\":\"bytes\"}],\"name\":\"upgradeToAndCall\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"uint256\",\"name\":\"version\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"sequence\",\"type\":\"uint256\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"string\",\"name\":\"addr\",\"type\":\"string\"}],\"internalType\":\"structPacketLibrary.OutNetworkAddress\",\"name\":\"sourceTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"uint256\",\"name\":\"chainId\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"addr\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InNetworkAddress\",\"name\":\"destTokenService\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"string\",\"name\":\"senderAddress\",\"type\":\"string\"},{\"internalType\":\"address\",\"name\":\"destTokenAddress\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"address\",\"name\":\"receiverAddress\",\"type\":\"address\"}],\"internalType\":\"structPacketLibrary.InTokenMessage\",\"name\":\"message\",\"type\":\"tuple\"},{\"internalType\":\"uint256\",\"name\":\"height\",\"type\":\"uint256\"}],\"internalType\":\"structPacketLibrary.InPacket\",\"name\":\"packet\",\"type\":\"tuple\"},{\"internalType\":\"bytes[]\",\"name\":\"sigs\",\"type\":\"bytes[]\"}],\"name\":\"withdraw\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}]",
}

// TokenServiceABI is the input ABI used to generate the binding from.
// Deprecated: Use TokenServiceMetaData.ABI instead.
var TokenServiceABI = TokenServiceMetaData.ABI

// TokenService is an auto generated Go binding around an Ethereum contract.
type TokenService struct {
	TokenServiceCaller     // Read-only binding to the contract
	TokenServiceTransactor // Write-only binding to the contract
	TokenServiceFilterer   // Log filterer for contract events
}

// TokenServiceCaller is an auto generated read-only Go binding around an Ethereum contract.
type TokenServiceCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// TokenServiceTransactor is an auto generated write-only Go binding around an Ethereum contract.
type TokenServiceTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// TokenServiceFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type TokenServiceFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// TokenServiceSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type TokenServiceSession struct {
	Contract     *TokenService     // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// TokenServiceCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type TokenServiceCallerSession struct {
	Contract *TokenServiceCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts       // Call options to use throughout this session
}

// TokenServiceTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type TokenServiceTransactorSession struct {
	Contract     *TokenServiceTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts       // Transaction auth options to use throughout this session
}

// TokenServiceRaw is an auto generated low-level Go binding around an Ethereum contract.
type TokenServiceRaw struct {
	Contract *TokenService // Generic contract binding to access the raw methods on
}

// TokenServiceCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type TokenServiceCallerRaw struct {
	Contract *TokenServiceCaller // Generic read-only contract binding to access the raw methods on
}

// TokenServiceTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type TokenServiceTransactorRaw struct {
	Contract *TokenServiceTransactor // Generic write-only contract binding to access the raw methods on
}

// NewTokenService creates a new instance of TokenService, bound to a specific deployed contract.
func NewTokenService(address common.Address, backend bind.ContractBackend) (*TokenService, error) {
	contract, err := bindTokenService(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &TokenService{TokenServiceCaller: TokenServiceCaller{contract: contract}, TokenServiceTransactor: TokenServiceTransactor{contract: contract}, TokenServiceFilterer: TokenServiceFilterer{contract: contract}}, nil
}

// NewTokenServiceCaller creates a new read-only instance of TokenService, bound to a specific deployed contract.
func NewTokenServiceCaller(address common.Address, caller bind.ContractCaller) (*TokenServiceCaller, error) {
	contract, err := bindTokenService(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &TokenServiceCaller{contract: contract}, nil
}

// NewTokenServiceTransactor creates a new write-only instance of TokenService, bound to a specific deployed contract.
func NewTokenServiceTransactor(address common.Address, transactor bind.ContractTransactor) (*TokenServiceTransactor, error) {
	contract, err := bindTokenService(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &TokenServiceTransactor{contract: contract}, nil
}

// NewTokenServiceFilterer creates a new log filterer instance of TokenService, bound to a specific deployed contract.
func NewTokenServiceFilterer(address common.Address, filterer bind.ContractFilterer) (*TokenServiceFilterer, error) {
	contract, err := bindTokenService(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &TokenServiceFilterer{contract: contract}, nil
}

// bindTokenService binds a generic wrapper to an already deployed contract.
func bindTokenService(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := TokenServiceMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_TokenService *TokenServiceRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _TokenService.Contract.TokenServiceCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_TokenService *TokenServiceRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _TokenService.Contract.TokenServiceTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_TokenService *TokenServiceRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _TokenService.Contract.TokenServiceTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_TokenService *TokenServiceCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _TokenService.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_TokenService *TokenServiceTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _TokenService.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_TokenService *TokenServiceTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _TokenService.Contract.contract.Transact(opts, method, params...)
}

// DestChainId is a free data retrieval call binding the contract method 0xc4af1c0b.
//
// Solidity: function destChainId() view returns(uint256)
func (_TokenService *TokenServiceCaller) DestChainId(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _TokenService.contract.Call(opts, &out, "destChainId")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// DestChainId is a free data retrieval call binding the contract method 0xc4af1c0b.
//
// Solidity: function destChainId() view returns(uint256)
func (_TokenService *TokenServiceSession) DestChainId() (*big.Int, error) {
	return _TokenService.Contract.DestChainId(&_TokenService.CallOpts)
}

// DestChainId is a free data retrieval call binding the contract method 0xc4af1c0b.
//
// Solidity: function destChainId() view returns(uint256)
func (_TokenService *TokenServiceCallerSession) DestChainId() (*big.Int, error) {
	return _TokenService.Contract.DestChainId(&_TokenService.CallOpts)
}

// IsAmountInRange is a free data retrieval call binding the contract method 0xdcbeeb23.
//
// Solidity: function isAmountInRange(address tokenAddress, uint256 amount) view returns(bool)
func (_TokenService *TokenServiceCaller) IsAmountInRange(opts *bind.CallOpts, tokenAddress common.Address, amount *big.Int) (bool, error) {
	var out []interface{}
	err := _TokenService.contract.Call(opts, &out, "isAmountInRange", tokenAddress, amount)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsAmountInRange is a free data retrieval call binding the contract method 0xdcbeeb23.
//
// Solidity: function isAmountInRange(address tokenAddress, uint256 amount) view returns(bool)
func (_TokenService *TokenServiceSession) IsAmountInRange(tokenAddress common.Address, amount *big.Int) (bool, error) {
	return _TokenService.Contract.IsAmountInRange(&_TokenService.CallOpts, tokenAddress, amount)
}

// IsAmountInRange is a free data retrieval call binding the contract method 0xdcbeeb23.
//
// Solidity: function isAmountInRange(address tokenAddress, uint256 amount) view returns(bool)
func (_TokenService *TokenServiceCallerSession) IsAmountInRange(tokenAddress common.Address, amount *big.Int) (bool, error) {
	return _TokenService.Contract.IsAmountInRange(&_TokenService.CallOpts, tokenAddress, amount)
}

// IsEnabledToken is a free data retrieval call binding the contract method 0x1beb1ab8.
//
// Solidity: function isEnabledToken(address token) view returns(bool)
func (_TokenService *TokenServiceCaller) IsEnabledToken(opts *bind.CallOpts, token common.Address) (bool, error) {
	var out []interface{}
	err := _TokenService.contract.Call(opts, &out, "isEnabledToken", token)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsEnabledToken is a free data retrieval call binding the contract method 0x1beb1ab8.
//
// Solidity: function isEnabledToken(address token) view returns(bool)
func (_TokenService *TokenServiceSession) IsEnabledToken(token common.Address) (bool, error) {
	return _TokenService.Contract.IsEnabledToken(&_TokenService.CallOpts, token)
}

// IsEnabledToken is a free data retrieval call binding the contract method 0x1beb1ab8.
//
// Solidity: function isEnabledToken(address token) view returns(bool)
func (_TokenService *TokenServiceCallerSession) IsEnabledToken(token common.Address) (bool, error) {
	return _TokenService.Contract.IsEnabledToken(&_TokenService.CallOpts, token)
}

// IsSupportedToken is a free data retrieval call binding the contract method 0x240028e8.
//
// Solidity: function isSupportedToken(address token) view returns(bool)
func (_TokenService *TokenServiceCaller) IsSupportedToken(opts *bind.CallOpts, token common.Address) (bool, error) {
	var out []interface{}
	err := _TokenService.contract.Call(opts, &out, "isSupportedToken", token)

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// IsSupportedToken is a free data retrieval call binding the contract method 0x240028e8.
//
// Solidity: function isSupportedToken(address token) view returns(bool)
func (_TokenService *TokenServiceSession) IsSupportedToken(token common.Address) (bool, error) {
	return _TokenService.Contract.IsSupportedToken(&_TokenService.CallOpts, token)
}

// IsSupportedToken is a free data retrieval call binding the contract method 0x240028e8.
//
// Solidity: function isSupportedToken(address token) view returns(bool)
func (_TokenService *TokenServiceCallerSession) IsSupportedToken(token common.Address) (bool, error) {
	return _TokenService.Contract.IsSupportedToken(&_TokenService.CallOpts, token)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_TokenService *TokenServiceCaller) Owner(opts *bind.CallOpts) (common.Address, error) {
	var out []interface{}
	err := _TokenService.contract.Call(opts, &out, "owner")

	if err != nil {
		return *new(common.Address), err
	}

	out0 := *abi.ConvertType(out[0], new(common.Address)).(*common.Address)

	return out0, err

}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_TokenService *TokenServiceSession) Owner() (common.Address, error) {
	return _TokenService.Contract.Owner(&_TokenService.CallOpts)
}

// Owner is a free data retrieval call binding the contract method 0x8da5cb5b.
//
// Solidity: function owner() view returns(address)
func (_TokenService *TokenServiceCallerSession) Owner() (common.Address, error) {
	return _TokenService.Contract.Owner(&_TokenService.CallOpts)
}

// Paused is a free data retrieval call binding the contract method 0x5c975abb.
//
// Solidity: function paused() view returns(bool)
func (_TokenService *TokenServiceCaller) Paused(opts *bind.CallOpts) (bool, error) {
	var out []interface{}
	err := _TokenService.contract.Call(opts, &out, "paused")

	if err != nil {
		return *new(bool), err
	}

	out0 := *abi.ConvertType(out[0], new(bool)).(*bool)

	return out0, err

}

// Paused is a free data retrieval call binding the contract method 0x5c975abb.
//
// Solidity: function paused() view returns(bool)
func (_TokenService *TokenServiceSession) Paused() (bool, error) {
	return _TokenService.Contract.Paused(&_TokenService.CallOpts)
}

// Paused is a free data retrieval call binding the contract method 0x5c975abb.
//
// Solidity: function paused() view returns(bool)
func (_TokenService *TokenServiceCallerSession) Paused() (bool, error) {
	return _TokenService.Contract.Paused(&_TokenService.CallOpts)
}

// ProxiableUUID is a free data retrieval call binding the contract method 0x52d1902d.
//
// Solidity: function proxiableUUID() view returns(bytes32)
func (_TokenService *TokenServiceCaller) ProxiableUUID(opts *bind.CallOpts) ([32]byte, error) {
	var out []interface{}
	err := _TokenService.contract.Call(opts, &out, "proxiableUUID")

	if err != nil {
		return *new([32]byte), err
	}

	out0 := *abi.ConvertType(out[0], new([32]byte)).(*[32]byte)

	return out0, err

}

// ProxiableUUID is a free data retrieval call binding the contract method 0x52d1902d.
//
// Solidity: function proxiableUUID() view returns(bytes32)
func (_TokenService *TokenServiceSession) ProxiableUUID() ([32]byte, error) {
	return _TokenService.Contract.ProxiableUUID(&_TokenService.CallOpts)
}

// ProxiableUUID is a free data retrieval call binding the contract method 0x52d1902d.
//
// Solidity: function proxiableUUID() view returns(bytes32)
func (_TokenService *TokenServiceCallerSession) ProxiableUUID() ([32]byte, error) {
	return _TokenService.Contract.ProxiableUUID(&_TokenService.CallOpts)
}

// Self is a free data retrieval call binding the contract method 0x7104ddb2.
//
// Solidity: function self() view returns(uint256 chainId, address addr)
func (_TokenService *TokenServiceCaller) Self(opts *bind.CallOpts) (struct {
	ChainId *big.Int
	Addr    common.Address
}, error) {
	var out []interface{}
	err := _TokenService.contract.Call(opts, &out, "self")

	outstruct := new(struct {
		ChainId *big.Int
		Addr    common.Address
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.ChainId = *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)
	outstruct.Addr = *abi.ConvertType(out[1], new(common.Address)).(*common.Address)

	return *outstruct, err

}

// Self is a free data retrieval call binding the contract method 0x7104ddb2.
//
// Solidity: function self() view returns(uint256 chainId, address addr)
func (_TokenService *TokenServiceSession) Self() (struct {
	ChainId *big.Int
	Addr    common.Address
}, error) {
	return _TokenService.Contract.Self(&_TokenService.CallOpts)
}

// Self is a free data retrieval call binding the contract method 0x7104ddb2.
//
// Solidity: function self() view returns(uint256 chainId, address addr)
func (_TokenService *TokenServiceCallerSession) Self() (struct {
	ChainId *big.Int
	Addr    common.Address
}, error) {
	return _TokenService.Contract.Self(&_TokenService.CallOpts)
}

// SupportedTokens is a free data retrieval call binding the contract method 0x68c4ac26.
//
// Solidity: function supportedTokens(address ) view returns(address tokenAddress, address vault, string destTokenAddress, string destTokenService, uint256 minValue, uint256 maxValue, bool enabled)
func (_TokenService *TokenServiceCaller) SupportedTokens(opts *bind.CallOpts, arg0 common.Address) (struct {
	TokenAddress     common.Address
	Vault            common.Address
	DestTokenAddress string
	DestTokenService string
	MinValue         *big.Int
	MaxValue         *big.Int
	Enabled          bool
}, error) {
	var out []interface{}
	err := _TokenService.contract.Call(opts, &out, "supportedTokens", arg0)

	outstruct := new(struct {
		TokenAddress     common.Address
		Vault            common.Address
		DestTokenAddress string
		DestTokenService string
		MinValue         *big.Int
		MaxValue         *big.Int
		Enabled          bool
	})
	if err != nil {
		return *outstruct, err
	}

	outstruct.TokenAddress = *abi.ConvertType(out[0], new(common.Address)).(*common.Address)
	outstruct.Vault = *abi.ConvertType(out[1], new(common.Address)).(*common.Address)
	outstruct.DestTokenAddress = *abi.ConvertType(out[2], new(string)).(*string)
	outstruct.DestTokenService = *abi.ConvertType(out[3], new(string)).(*string)
	outstruct.MinValue = *abi.ConvertType(out[4], new(*big.Int)).(**big.Int)
	outstruct.MaxValue = *abi.ConvertType(out[5], new(*big.Int)).(**big.Int)
	outstruct.Enabled = *abi.ConvertType(out[6], new(bool)).(*bool)

	return *outstruct, err

}

// SupportedTokens is a free data retrieval call binding the contract method 0x68c4ac26.
//
// Solidity: function supportedTokens(address ) view returns(address tokenAddress, address vault, string destTokenAddress, string destTokenService, uint256 minValue, uint256 maxValue, bool enabled)
func (_TokenService *TokenServiceSession) SupportedTokens(arg0 common.Address) (struct {
	TokenAddress     common.Address
	Vault            common.Address
	DestTokenAddress string
	DestTokenService string
	MinValue         *big.Int
	MaxValue         *big.Int
	Enabled          bool
}, error) {
	return _TokenService.Contract.SupportedTokens(&_TokenService.CallOpts, arg0)
}

// SupportedTokens is a free data retrieval call binding the contract method 0x68c4ac26.
//
// Solidity: function supportedTokens(address ) view returns(address tokenAddress, address vault, string destTokenAddress, string destTokenService, uint256 minValue, uint256 maxValue, bool enabled)
func (_TokenService *TokenServiceCallerSession) SupportedTokens(arg0 common.Address) (struct {
	TokenAddress     common.Address
	Vault            common.Address
	DestTokenAddress string
	DestTokenService string
	MinValue         *big.Int
	MaxValue         *big.Int
	Enabled          bool
}, error) {
	return _TokenService.Contract.SupportedTokens(&_TokenService.CallOpts, arg0)
}

// TokenType is a free data retrieval call binding the contract method 0x30fa738c.
//
// Solidity: function tokenType() pure returns(string)
func (_TokenService *TokenServiceCaller) TokenType(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _TokenService.contract.Call(opts, &out, "tokenType")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// TokenType is a free data retrieval call binding the contract method 0x30fa738c.
//
// Solidity: function tokenType() pure returns(string)
func (_TokenService *TokenServiceSession) TokenType() (string, error) {
	return _TokenService.Contract.TokenType(&_TokenService.CallOpts)
}

// TokenType is a free data retrieval call binding the contract method 0x30fa738c.
//
// Solidity: function tokenType() pure returns(string)
func (_TokenService *TokenServiceCallerSession) TokenType() (string, error) {
	return _TokenService.Contract.TokenType(&_TokenService.CallOpts)
}

// Initialize is a paid mutator transaction binding the contract method 0xfeda02b6.
//
// Solidity: function _initialize(address _owner, uint256 _destChainId) returns()
func (_TokenService *TokenServiceTransactor) Initialize(opts *bind.TransactOpts, _owner common.Address, _destChainId *big.Int) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "_initialize", _owner, _destChainId)
}

// Initialize is a paid mutator transaction binding the contract method 0xfeda02b6.
//
// Solidity: function _initialize(address _owner, uint256 _destChainId) returns()
func (_TokenService *TokenServiceSession) Initialize(_owner common.Address, _destChainId *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.Initialize(&_TokenService.TransactOpts, _owner, _destChainId)
}

// Initialize is a paid mutator transaction binding the contract method 0xfeda02b6.
//
// Solidity: function _initialize(address _owner, uint256 _destChainId) returns()
func (_TokenService *TokenServiceTransactorSession) Initialize(_owner common.Address, _destChainId *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.Initialize(&_TokenService.TransactOpts, _owner, _destChainId)
}

// AddToken is a paid mutator transaction binding the contract method 0xc354c62f.
//
// Solidity: function addToken(address tokenAddress, uint256 _destChainId, address vault, string destTokenAddress, string destTokenService, uint256 min, uint256 max) returns()
func (_TokenService *TokenServiceTransactor) AddToken(opts *bind.TransactOpts, tokenAddress common.Address, _destChainId *big.Int, vault common.Address, destTokenAddress string, destTokenService string, min *big.Int, max *big.Int) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "addToken", tokenAddress, _destChainId, vault, destTokenAddress, destTokenService, min, max)
}

// AddToken is a paid mutator transaction binding the contract method 0xc354c62f.
//
// Solidity: function addToken(address tokenAddress, uint256 _destChainId, address vault, string destTokenAddress, string destTokenService, uint256 min, uint256 max) returns()
func (_TokenService *TokenServiceSession) AddToken(tokenAddress common.Address, _destChainId *big.Int, vault common.Address, destTokenAddress string, destTokenService string, min *big.Int, max *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.AddToken(&_TokenService.TransactOpts, tokenAddress, _destChainId, vault, destTokenAddress, destTokenService, min, max)
}

// AddToken is a paid mutator transaction binding the contract method 0xc354c62f.
//
// Solidity: function addToken(address tokenAddress, uint256 _destChainId, address vault, string destTokenAddress, string destTokenService, uint256 min, uint256 max) returns()
func (_TokenService *TokenServiceTransactorSession) AddToken(tokenAddress common.Address, _destChainId *big.Int, vault common.Address, destTokenAddress string, destTokenService string, min *big.Int, max *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.AddToken(&_TokenService.TransactOpts, tokenAddress, _destChainId, vault, destTokenAddress, destTokenService, min, max)
}

// Disable is a paid mutator transaction binding the contract method 0xfe9f841e.
//
// Solidity: function disable(address tokenAddress, uint256 _destChainId) returns()
func (_TokenService *TokenServiceTransactor) Disable(opts *bind.TransactOpts, tokenAddress common.Address, _destChainId *big.Int) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "disable", tokenAddress, _destChainId)
}

// Disable is a paid mutator transaction binding the contract method 0xfe9f841e.
//
// Solidity: function disable(address tokenAddress, uint256 _destChainId) returns()
func (_TokenService *TokenServiceSession) Disable(tokenAddress common.Address, _destChainId *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.Disable(&_TokenService.TransactOpts, tokenAddress, _destChainId)
}

// Disable is a paid mutator transaction binding the contract method 0xfe9f841e.
//
// Solidity: function disable(address tokenAddress, uint256 _destChainId) returns()
func (_TokenService *TokenServiceTransactorSession) Disable(tokenAddress common.Address, _destChainId *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.Disable(&_TokenService.TransactOpts, tokenAddress, _destChainId)
}

// Enable is a paid mutator transaction binding the contract method 0xfe102e88.
//
// Solidity: function enable(address tokenAddress, uint256 _destChainId) returns()
func (_TokenService *TokenServiceTransactor) Enable(opts *bind.TransactOpts, tokenAddress common.Address, _destChainId *big.Int) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "enable", tokenAddress, _destChainId)
}

// Enable is a paid mutator transaction binding the contract method 0xfe102e88.
//
// Solidity: function enable(address tokenAddress, uint256 _destChainId) returns()
func (_TokenService *TokenServiceSession) Enable(tokenAddress common.Address, _destChainId *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.Enable(&_TokenService.TransactOpts, tokenAddress, _destChainId)
}

// Enable is a paid mutator transaction binding the contract method 0xfe102e88.
//
// Solidity: function enable(address tokenAddress, uint256 _destChainId) returns()
func (_TokenService *TokenServiceTransactorSession) Enable(tokenAddress common.Address, _destChainId *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.Enable(&_TokenService.TransactOpts, tokenAddress, _destChainId)
}

// Init is a paid mutator transaction binding the contract method 0x03b54d52.
//
// Solidity: function initialize(address bridge, uint256 _chainId, uint256 _destChainId, address _owner, address _blackListService) returns()
func (_TokenService *TokenServiceTransactor) Init(opts *bind.TransactOpts, bridge common.Address, _chainId *big.Int, _destChainId *big.Int, _owner common.Address, _blackListService common.Address) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "initialize", bridge, _chainId, _destChainId, _owner, _blackListService)
}

// Init is a paid mutator transaction binding the contract method 0x03b54d52.
//
// Solidity: function initialize(address bridge, uint256 _chainId, uint256 _destChainId, address _owner, address _blackListService) returns()
func (_TokenService *TokenServiceSession) Init(bridge common.Address, _chainId *big.Int, _destChainId *big.Int, _owner common.Address, _blackListService common.Address) (*types.Transaction, error) {
	return _TokenService.Contract.Init(&_TokenService.TransactOpts, bridge, _chainId, _destChainId, _owner, _blackListService)
}

// Init is a paid mutator transaction binding the contract method 0x03b54d52.
//
// Solidity: function initialize(address bridge, uint256 _chainId, uint256 _destChainId, address _owner, address _blackListService) returns()
func (_TokenService *TokenServiceTransactorSession) Init(bridge common.Address, _chainId *big.Int, _destChainId *big.Int, _owner common.Address, _blackListService common.Address) (*types.Transaction, error) {
	return _TokenService.Contract.Init(&_TokenService.TransactOpts, bridge, _chainId, _destChainId, _owner, _blackListService)
}

// Pause is a paid mutator transaction binding the contract method 0x8456cb59.
//
// Solidity: function pause() returns()
func (_TokenService *TokenServiceTransactor) Pause(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "pause")
}

// Pause is a paid mutator transaction binding the contract method 0x8456cb59.
//
// Solidity: function pause() returns()
func (_TokenService *TokenServiceSession) Pause() (*types.Transaction, error) {
	return _TokenService.Contract.Pause(&_TokenService.TransactOpts)
}

// Pause is a paid mutator transaction binding the contract method 0x8456cb59.
//
// Solidity: function pause() returns()
func (_TokenService *TokenServiceTransactorSession) Pause() (*types.Transaction, error) {
	return _TokenService.Contract.Pause(&_TokenService.TransactOpts)
}

// RemoveToken is a paid mutator transaction binding the contract method 0x13baf1e6.
//
// Solidity: function removeToken(address tokenAddress, uint256 _destChainId) returns()
func (_TokenService *TokenServiceTransactor) RemoveToken(opts *bind.TransactOpts, tokenAddress common.Address, _destChainId *big.Int) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "removeToken", tokenAddress, _destChainId)
}

// RemoveToken is a paid mutator transaction binding the contract method 0x13baf1e6.
//
// Solidity: function removeToken(address tokenAddress, uint256 _destChainId) returns()
func (_TokenService *TokenServiceSession) RemoveToken(tokenAddress common.Address, _destChainId *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.RemoveToken(&_TokenService.TransactOpts, tokenAddress, _destChainId)
}

// RemoveToken is a paid mutator transaction binding the contract method 0x13baf1e6.
//
// Solidity: function removeToken(address tokenAddress, uint256 _destChainId) returns()
func (_TokenService *TokenServiceTransactorSession) RemoveToken(tokenAddress common.Address, _destChainId *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.RemoveToken(&_TokenService.TransactOpts, tokenAddress, _destChainId)
}

// SetHolding is a paid mutator transaction binding the contract method 0x9936077e.
//
// Solidity: function setHolding(address _holding) returns()
func (_TokenService *TokenServiceTransactor) SetHolding(opts *bind.TransactOpts, _holding common.Address) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "setHolding", _holding)
}

// SetHolding is a paid mutator transaction binding the contract method 0x9936077e.
//
// Solidity: function setHolding(address _holding) returns()
func (_TokenService *TokenServiceSession) SetHolding(_holding common.Address) (*types.Transaction, error) {
	return _TokenService.Contract.SetHolding(&_TokenService.TransactOpts, _holding)
}

// SetHolding is a paid mutator transaction binding the contract method 0x9936077e.
//
// Solidity: function setHolding(address _holding) returns()
func (_TokenService *TokenServiceTransactorSession) SetHolding(_holding common.Address) (*types.Transaction, error) {
	return _TokenService.Contract.SetHolding(&_TokenService.TransactOpts, _holding)
}

// Transfer is a paid mutator transaction binding the contract method 0x56b8c724.
//
// Solidity: function transfer(address tokenAddress, uint256 amount, string receiver) returns()
func (_TokenService *TokenServiceTransactor) Transfer(opts *bind.TransactOpts, tokenAddress common.Address, amount *big.Int, receiver string) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "transfer", tokenAddress, amount, receiver)
}

// Transfer is a paid mutator transaction binding the contract method 0x56b8c724.
//
// Solidity: function transfer(address tokenAddress, uint256 amount, string receiver) returns()
func (_TokenService *TokenServiceSession) Transfer(tokenAddress common.Address, amount *big.Int, receiver string) (*types.Transaction, error) {
	return _TokenService.Contract.Transfer(&_TokenService.TransactOpts, tokenAddress, amount, receiver)
}

// Transfer is a paid mutator transaction binding the contract method 0x56b8c724.
//
// Solidity: function transfer(address tokenAddress, uint256 amount, string receiver) returns()
func (_TokenService *TokenServiceTransactorSession) Transfer(tokenAddress common.Address, amount *big.Int, receiver string) (*types.Transaction, error) {
	return _TokenService.Contract.Transfer(&_TokenService.TransactOpts, tokenAddress, amount, receiver)
}

// Transfer0 is a paid mutator transaction binding the contract method 0xa0258d0b.
//
// Solidity: function transfer(string receiver) payable returns()
func (_TokenService *TokenServiceTransactor) Transfer0(opts *bind.TransactOpts, receiver string) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "transfer0", receiver)
}

// Transfer0 is a paid mutator transaction binding the contract method 0xa0258d0b.
//
// Solidity: function transfer(string receiver) payable returns()
func (_TokenService *TokenServiceSession) Transfer0(receiver string) (*types.Transaction, error) {
	return _TokenService.Contract.Transfer0(&_TokenService.TransactOpts, receiver)
}

// Transfer0 is a paid mutator transaction binding the contract method 0xa0258d0b.
//
// Solidity: function transfer(string receiver) payable returns()
func (_TokenService *TokenServiceTransactorSession) Transfer0(receiver string) (*types.Transaction, error) {
	return _TokenService.Contract.Transfer0(&_TokenService.TransactOpts, receiver)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_TokenService *TokenServiceTransactor) TransferOwnership(opts *bind.TransactOpts, newOwner common.Address) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "transferOwnership", newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_TokenService *TokenServiceSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _TokenService.Contract.TransferOwnership(&_TokenService.TransactOpts, newOwner)
}

// TransferOwnership is a paid mutator transaction binding the contract method 0xf2fde38b.
//
// Solidity: function transferOwnership(address newOwner) returns()
func (_TokenService *TokenServiceTransactorSession) TransferOwnership(newOwner common.Address) (*types.Transaction, error) {
	return _TokenService.Contract.TransferOwnership(&_TokenService.TransactOpts, newOwner)
}

// TransferToVault is a paid mutator transaction binding the contract method 0x89a71faa.
//
// Solidity: function transferToVault(address token, uint256 amount) returns()
func (_TokenService *TokenServiceTransactor) TransferToVault(opts *bind.TransactOpts, token common.Address, amount *big.Int) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "transferToVault", token, amount)
}

// TransferToVault is a paid mutator transaction binding the contract method 0x89a71faa.
//
// Solidity: function transferToVault(address token, uint256 amount) returns()
func (_TokenService *TokenServiceSession) TransferToVault(token common.Address, amount *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.TransferToVault(&_TokenService.TransactOpts, token, amount)
}

// TransferToVault is a paid mutator transaction binding the contract method 0x89a71faa.
//
// Solidity: function transferToVault(address token, uint256 amount) returns()
func (_TokenService *TokenServiceTransactorSession) TransferToVault(token common.Address, amount *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.TransferToVault(&_TokenService.TransactOpts, token, amount)
}

// Unpause is a paid mutator transaction binding the contract method 0x3f4ba83a.
//
// Solidity: function unpause() returns()
func (_TokenService *TokenServiceTransactor) Unpause(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "unpause")
}

// Unpause is a paid mutator transaction binding the contract method 0x3f4ba83a.
//
// Solidity: function unpause() returns()
func (_TokenService *TokenServiceSession) Unpause() (*types.Transaction, error) {
	return _TokenService.Contract.Unpause(&_TokenService.TransactOpts)
}

// Unpause is a paid mutator transaction binding the contract method 0x3f4ba83a.
//
// Solidity: function unpause() returns()
func (_TokenService *TokenServiceTransactorSession) Unpause() (*types.Transaction, error) {
	return _TokenService.Contract.Unpause(&_TokenService.TransactOpts)
}

// UpdateMaxValue is a paid mutator transaction binding the contract method 0x55b53413.
//
// Solidity: function updateMaxValue(address tokenAddress, uint256 maxValue) returns()
func (_TokenService *TokenServiceTransactor) UpdateMaxValue(opts *bind.TransactOpts, tokenAddress common.Address, maxValue *big.Int) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "updateMaxValue", tokenAddress, maxValue)
}

// UpdateMaxValue is a paid mutator transaction binding the contract method 0x55b53413.
//
// Solidity: function updateMaxValue(address tokenAddress, uint256 maxValue) returns()
func (_TokenService *TokenServiceSession) UpdateMaxValue(tokenAddress common.Address, maxValue *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.UpdateMaxValue(&_TokenService.TransactOpts, tokenAddress, maxValue)
}

// UpdateMaxValue is a paid mutator transaction binding the contract method 0x55b53413.
//
// Solidity: function updateMaxValue(address tokenAddress, uint256 maxValue) returns()
func (_TokenService *TokenServiceTransactorSession) UpdateMaxValue(tokenAddress common.Address, maxValue *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.UpdateMaxValue(&_TokenService.TransactOpts, tokenAddress, maxValue)
}

// UpdateMinValue is a paid mutator transaction binding the contract method 0x473b7263.
//
// Solidity: function updateMinValue(address tokenAddress, uint256 minValue) returns()
func (_TokenService *TokenServiceTransactor) UpdateMinValue(opts *bind.TransactOpts, tokenAddress common.Address, minValue *big.Int) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "updateMinValue", tokenAddress, minValue)
}

// UpdateMinValue is a paid mutator transaction binding the contract method 0x473b7263.
//
// Solidity: function updateMinValue(address tokenAddress, uint256 minValue) returns()
func (_TokenService *TokenServiceSession) UpdateMinValue(tokenAddress common.Address, minValue *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.UpdateMinValue(&_TokenService.TransactOpts, tokenAddress, minValue)
}

// UpdateMinValue is a paid mutator transaction binding the contract method 0x473b7263.
//
// Solidity: function updateMinValue(address tokenAddress, uint256 minValue) returns()
func (_TokenService *TokenServiceTransactorSession) UpdateMinValue(tokenAddress common.Address, minValue *big.Int) (*types.Transaction, error) {
	return _TokenService.Contract.UpdateMinValue(&_TokenService.TransactOpts, tokenAddress, minValue)
}

// UpgradeTo is a paid mutator transaction binding the contract method 0x3659cfe6.
//
// Solidity: function upgradeTo(address newImplementation) returns()
func (_TokenService *TokenServiceTransactor) UpgradeTo(opts *bind.TransactOpts, newImplementation common.Address) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "upgradeTo", newImplementation)
}

// UpgradeTo is a paid mutator transaction binding the contract method 0x3659cfe6.
//
// Solidity: function upgradeTo(address newImplementation) returns()
func (_TokenService *TokenServiceSession) UpgradeTo(newImplementation common.Address) (*types.Transaction, error) {
	return _TokenService.Contract.UpgradeTo(&_TokenService.TransactOpts, newImplementation)
}

// UpgradeTo is a paid mutator transaction binding the contract method 0x3659cfe6.
//
// Solidity: function upgradeTo(address newImplementation) returns()
func (_TokenService *TokenServiceTransactorSession) UpgradeTo(newImplementation common.Address) (*types.Transaction, error) {
	return _TokenService.Contract.UpgradeTo(&_TokenService.TransactOpts, newImplementation)
}

// UpgradeToAndCall is a paid mutator transaction binding the contract method 0x4f1ef286.
//
// Solidity: function upgradeToAndCall(address newImplementation, bytes data) payable returns()
func (_TokenService *TokenServiceTransactor) UpgradeToAndCall(opts *bind.TransactOpts, newImplementation common.Address, data []byte) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "upgradeToAndCall", newImplementation, data)
}

// UpgradeToAndCall is a paid mutator transaction binding the contract method 0x4f1ef286.
//
// Solidity: function upgradeToAndCall(address newImplementation, bytes data) payable returns()
func (_TokenService *TokenServiceSession) UpgradeToAndCall(newImplementation common.Address, data []byte) (*types.Transaction, error) {
	return _TokenService.Contract.UpgradeToAndCall(&_TokenService.TransactOpts, newImplementation, data)
}

// UpgradeToAndCall is a paid mutator transaction binding the contract method 0x4f1ef286.
//
// Solidity: function upgradeToAndCall(address newImplementation, bytes data) payable returns()
func (_TokenService *TokenServiceTransactorSession) UpgradeToAndCall(newImplementation common.Address, data []byte) (*types.Transaction, error) {
	return _TokenService.Contract.UpgradeToAndCall(&_TokenService.TransactOpts, newImplementation, data)
}

// Withdraw is a paid mutator transaction binding the contract method 0x89aa1df8.
//
// Solidity: function withdraw((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet, bytes[] sigs) returns()
func (_TokenService *TokenServiceTransactor) Withdraw(opts *bind.TransactOpts, packet PacketLibraryInPacket, sigs [][]byte) (*types.Transaction, error) {
	return _TokenService.contract.Transact(opts, "withdraw", packet, sigs)
}

// Withdraw is a paid mutator transaction binding the contract method 0x89aa1df8.
//
// Solidity: function withdraw((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet, bytes[] sigs) returns()
func (_TokenService *TokenServiceSession) Withdraw(packet PacketLibraryInPacket, sigs [][]byte) (*types.Transaction, error) {
	return _TokenService.Contract.Withdraw(&_TokenService.TransactOpts, packet, sigs)
}

// Withdraw is a paid mutator transaction binding the contract method 0x89aa1df8.
//
// Solidity: function withdraw((uint256,uint256,(uint256,string),(uint256,address),(string,address,uint256,address),uint256) packet, bytes[] sigs) returns()
func (_TokenService *TokenServiceTransactorSession) Withdraw(packet PacketLibraryInPacket, sigs [][]byte) (*types.Transaction, error) {
	return _TokenService.Contract.Withdraw(&_TokenService.TransactOpts, packet, sigs)
}

// TokenServiceAdminChangedIterator is returned from FilterAdminChanged and is used to iterate over the raw logs and unpacked data for AdminChanged events raised by the TokenService contract.
type TokenServiceAdminChangedIterator struct {
	Event *TokenServiceAdminChanged // Event containing the contract specifics and raw log

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
func (it *TokenServiceAdminChangedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServiceAdminChanged)
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
		it.Event = new(TokenServiceAdminChanged)
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
func (it *TokenServiceAdminChangedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServiceAdminChangedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServiceAdminChanged represents a AdminChanged event raised by the TokenService contract.
type TokenServiceAdminChanged struct {
	PreviousAdmin common.Address
	NewAdmin      common.Address
	Raw           types.Log // Blockchain specific contextual infos
}

// FilterAdminChanged is a free log retrieval operation binding the contract event 0x7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f.
//
// Solidity: event AdminChanged(address previousAdmin, address newAdmin)
func (_TokenService *TokenServiceFilterer) FilterAdminChanged(opts *bind.FilterOpts) (*TokenServiceAdminChangedIterator, error) {

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "AdminChanged")
	if err != nil {
		return nil, err
	}
	return &TokenServiceAdminChangedIterator{contract: _TokenService.contract, event: "AdminChanged", logs: logs, sub: sub}, nil
}

// WatchAdminChanged is a free log subscription operation binding the contract event 0x7e644d79422f17c01e4894b5f4f588d331ebfa28653d42ae832dc59e38c9798f.
//
// Solidity: event AdminChanged(address previousAdmin, address newAdmin)
func (_TokenService *TokenServiceFilterer) WatchAdminChanged(opts *bind.WatchOpts, sink chan<- *TokenServiceAdminChanged) (event.Subscription, error) {

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "AdminChanged")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServiceAdminChanged)
				if err := _TokenService.contract.UnpackLog(event, "AdminChanged", log); err != nil {
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
func (_TokenService *TokenServiceFilterer) ParseAdminChanged(log types.Log) (*TokenServiceAdminChanged, error) {
	event := new(TokenServiceAdminChanged)
	if err := _TokenService.contract.UnpackLog(event, "AdminChanged", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// TokenServiceBeaconUpgradedIterator is returned from FilterBeaconUpgraded and is used to iterate over the raw logs and unpacked data for BeaconUpgraded events raised by the TokenService contract.
type TokenServiceBeaconUpgradedIterator struct {
	Event *TokenServiceBeaconUpgraded // Event containing the contract specifics and raw log

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
func (it *TokenServiceBeaconUpgradedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServiceBeaconUpgraded)
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
		it.Event = new(TokenServiceBeaconUpgraded)
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
func (it *TokenServiceBeaconUpgradedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServiceBeaconUpgradedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServiceBeaconUpgraded represents a BeaconUpgraded event raised by the TokenService contract.
type TokenServiceBeaconUpgraded struct {
	Beacon common.Address
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterBeaconUpgraded is a free log retrieval operation binding the contract event 0x1cf3b03a6cf19fa2baba4df148e9dcabedea7f8a5c07840e207e5c089be95d3e.
//
// Solidity: event BeaconUpgraded(address indexed beacon)
func (_TokenService *TokenServiceFilterer) FilterBeaconUpgraded(opts *bind.FilterOpts, beacon []common.Address) (*TokenServiceBeaconUpgradedIterator, error) {

	var beaconRule []interface{}
	for _, beaconItem := range beacon {
		beaconRule = append(beaconRule, beaconItem)
	}

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "BeaconUpgraded", beaconRule)
	if err != nil {
		return nil, err
	}
	return &TokenServiceBeaconUpgradedIterator{contract: _TokenService.contract, event: "BeaconUpgraded", logs: logs, sub: sub}, nil
}

// WatchBeaconUpgraded is a free log subscription operation binding the contract event 0x1cf3b03a6cf19fa2baba4df148e9dcabedea7f8a5c07840e207e5c089be95d3e.
//
// Solidity: event BeaconUpgraded(address indexed beacon)
func (_TokenService *TokenServiceFilterer) WatchBeaconUpgraded(opts *bind.WatchOpts, sink chan<- *TokenServiceBeaconUpgraded, beacon []common.Address) (event.Subscription, error) {

	var beaconRule []interface{}
	for _, beaconItem := range beacon {
		beaconRule = append(beaconRule, beaconItem)
	}

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "BeaconUpgraded", beaconRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServiceBeaconUpgraded)
				if err := _TokenService.contract.UnpackLog(event, "BeaconUpgraded", log); err != nil {
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
func (_TokenService *TokenServiceFilterer) ParseBeaconUpgraded(log types.Log) (*TokenServiceBeaconUpgraded, error) {
	event := new(TokenServiceBeaconUpgraded)
	if err := _TokenService.contract.UnpackLog(event, "BeaconUpgraded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// TokenServiceInitializedIterator is returned from FilterInitialized and is used to iterate over the raw logs and unpacked data for Initialized events raised by the TokenService contract.
type TokenServiceInitializedIterator struct {
	Event *TokenServiceInitialized // Event containing the contract specifics and raw log

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
func (it *TokenServiceInitializedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServiceInitialized)
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
		it.Event = new(TokenServiceInitialized)
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
func (it *TokenServiceInitializedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServiceInitializedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServiceInitialized represents a Initialized event raised by the TokenService contract.
type TokenServiceInitialized struct {
	Version uint8
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterInitialized is a free log retrieval operation binding the contract event 0x7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb3847402498.
//
// Solidity: event Initialized(uint8 version)
func (_TokenService *TokenServiceFilterer) FilterInitialized(opts *bind.FilterOpts) (*TokenServiceInitializedIterator, error) {

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return &TokenServiceInitializedIterator{contract: _TokenService.contract, event: "Initialized", logs: logs, sub: sub}, nil
}

// WatchInitialized is a free log subscription operation binding the contract event 0x7f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb3847402498.
//
// Solidity: event Initialized(uint8 version)
func (_TokenService *TokenServiceFilterer) WatchInitialized(opts *bind.WatchOpts, sink chan<- *TokenServiceInitialized) (event.Subscription, error) {

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "Initialized")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServiceInitialized)
				if err := _TokenService.contract.UnpackLog(event, "Initialized", log); err != nil {
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
func (_TokenService *TokenServiceFilterer) ParseInitialized(log types.Log) (*TokenServiceInitialized, error) {
	event := new(TokenServiceInitialized)
	if err := _TokenService.contract.UnpackLog(event, "Initialized", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// TokenServiceOwnershipTransferredIterator is returned from FilterOwnershipTransferred and is used to iterate over the raw logs and unpacked data for OwnershipTransferred events raised by the TokenService contract.
type TokenServiceOwnershipTransferredIterator struct {
	Event *TokenServiceOwnershipTransferred // Event containing the contract specifics and raw log

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
func (it *TokenServiceOwnershipTransferredIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServiceOwnershipTransferred)
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
		it.Event = new(TokenServiceOwnershipTransferred)
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
func (it *TokenServiceOwnershipTransferredIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServiceOwnershipTransferredIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServiceOwnershipTransferred represents a OwnershipTransferred event raised by the TokenService contract.
type TokenServiceOwnershipTransferred struct {
	OldOwner common.Address
	NewOwner common.Address
	Raw      types.Log // Blockchain specific contextual infos
}

// FilterOwnershipTransferred is a free log retrieval operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address oldOwner, address newOwner)
func (_TokenService *TokenServiceFilterer) FilterOwnershipTransferred(opts *bind.FilterOpts) (*TokenServiceOwnershipTransferredIterator, error) {

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "OwnershipTransferred")
	if err != nil {
		return nil, err
	}
	return &TokenServiceOwnershipTransferredIterator{contract: _TokenService.contract, event: "OwnershipTransferred", logs: logs, sub: sub}, nil
}

// WatchOwnershipTransferred is a free log subscription operation binding the contract event 0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0.
//
// Solidity: event OwnershipTransferred(address oldOwner, address newOwner)
func (_TokenService *TokenServiceFilterer) WatchOwnershipTransferred(opts *bind.WatchOpts, sink chan<- *TokenServiceOwnershipTransferred) (event.Subscription, error) {

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "OwnershipTransferred")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServiceOwnershipTransferred)
				if err := _TokenService.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
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
// Solidity: event OwnershipTransferred(address oldOwner, address newOwner)
func (_TokenService *TokenServiceFilterer) ParseOwnershipTransferred(log types.Log) (*TokenServiceOwnershipTransferred, error) {
	event := new(TokenServiceOwnershipTransferred)
	if err := _TokenService.contract.UnpackLog(event, "OwnershipTransferred", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// TokenServicePauseIterator is returned from FilterPause and is used to iterate over the raw logs and unpacked data for Pause events raised by the TokenService contract.
type TokenServicePauseIterator struct {
	Event *TokenServicePause // Event containing the contract specifics and raw log

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
func (it *TokenServicePauseIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServicePause)
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
		it.Event = new(TokenServicePause)
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
func (it *TokenServicePauseIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServicePauseIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServicePause represents a Pause event raised by the TokenService contract.
type TokenServicePause struct {
	Raw types.Log // Blockchain specific contextual infos
}

// FilterPause is a free log retrieval operation binding the contract event 0x6985a02210a168e66602d3235cb6db0e70f92b3ba4d376a33c0f3d9434bff625.
//
// Solidity: event Pause()
func (_TokenService *TokenServiceFilterer) FilterPause(opts *bind.FilterOpts) (*TokenServicePauseIterator, error) {

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "Pause")
	if err != nil {
		return nil, err
	}
	return &TokenServicePauseIterator{contract: _TokenService.contract, event: "Pause", logs: logs, sub: sub}, nil
}

// WatchPause is a free log subscription operation binding the contract event 0x6985a02210a168e66602d3235cb6db0e70f92b3ba4d376a33c0f3d9434bff625.
//
// Solidity: event Pause()
func (_TokenService *TokenServiceFilterer) WatchPause(opts *bind.WatchOpts, sink chan<- *TokenServicePause) (event.Subscription, error) {

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "Pause")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServicePause)
				if err := _TokenService.contract.UnpackLog(event, "Pause", log); err != nil {
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

// ParsePause is a log parse operation binding the contract event 0x6985a02210a168e66602d3235cb6db0e70f92b3ba4d376a33c0f3d9434bff625.
//
// Solidity: event Pause()
func (_TokenService *TokenServiceFilterer) ParsePause(log types.Log) (*TokenServicePause, error) {
	event := new(TokenServicePause)
	if err := _TokenService.contract.UnpackLog(event, "Pause", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// TokenServiceTokenAddedIterator is returned from FilterTokenAdded and is used to iterate over the raw logs and unpacked data for TokenAdded events raised by the TokenService contract.
type TokenServiceTokenAddedIterator struct {
	Event *TokenServiceTokenAdded // Event containing the contract specifics and raw log

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
func (it *TokenServiceTokenAddedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServiceTokenAdded)
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
		it.Event = new(TokenServiceTokenAdded)
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
func (it *TokenServiceTokenAddedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServiceTokenAddedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServiceTokenAdded represents a TokenAdded event raised by the TokenService contract.
type TokenServiceTokenAdded struct {
	Token       TokenSupportToken
	DestChainId *big.Int
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterTokenAdded is a free log retrieval operation binding the contract event 0xf7a6d688a353b66d1ebb8f5080c5b7513eaab79221239496ee76041df102a025.
//
// Solidity: event TokenAdded((address,address,string,string,uint256,uint256,bool) token, uint256 destChainId)
func (_TokenService *TokenServiceFilterer) FilterTokenAdded(opts *bind.FilterOpts) (*TokenServiceTokenAddedIterator, error) {

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "TokenAdded")
	if err != nil {
		return nil, err
	}
	return &TokenServiceTokenAddedIterator{contract: _TokenService.contract, event: "TokenAdded", logs: logs, sub: sub}, nil
}

// WatchTokenAdded is a free log subscription operation binding the contract event 0xf7a6d688a353b66d1ebb8f5080c5b7513eaab79221239496ee76041df102a025.
//
// Solidity: event TokenAdded((address,address,string,string,uint256,uint256,bool) token, uint256 destChainId)
func (_TokenService *TokenServiceFilterer) WatchTokenAdded(opts *bind.WatchOpts, sink chan<- *TokenServiceTokenAdded) (event.Subscription, error) {

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "TokenAdded")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServiceTokenAdded)
				if err := _TokenService.contract.UnpackLog(event, "TokenAdded", log); err != nil {
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

// ParseTokenAdded is a log parse operation binding the contract event 0xf7a6d688a353b66d1ebb8f5080c5b7513eaab79221239496ee76041df102a025.
//
// Solidity: event TokenAdded((address,address,string,string,uint256,uint256,bool) token, uint256 destChainId)
func (_TokenService *TokenServiceFilterer) ParseTokenAdded(log types.Log) (*TokenServiceTokenAdded, error) {
	event := new(TokenServiceTokenAdded)
	if err := _TokenService.contract.UnpackLog(event, "TokenAdded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// TokenServiceTokenDisabledIterator is returned from FilterTokenDisabled and is used to iterate over the raw logs and unpacked data for TokenDisabled events raised by the TokenService contract.
type TokenServiceTokenDisabledIterator struct {
	Event *TokenServiceTokenDisabled // Event containing the contract specifics and raw log

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
func (it *TokenServiceTokenDisabledIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServiceTokenDisabled)
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
		it.Event = new(TokenServiceTokenDisabled)
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
func (it *TokenServiceTokenDisabledIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServiceTokenDisabledIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServiceTokenDisabled represents a TokenDisabled event raised by the TokenService contract.
type TokenServiceTokenDisabled struct {
	Token       common.Address
	DestChainId *big.Int
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterTokenDisabled is a free log retrieval operation binding the contract event 0x7e853a44c5ec3f34ea62e92332609e2588e70e4300133dce82a820efbc227aab.
//
// Solidity: event TokenDisabled(address token, uint256 destChainId)
func (_TokenService *TokenServiceFilterer) FilterTokenDisabled(opts *bind.FilterOpts) (*TokenServiceTokenDisabledIterator, error) {

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "TokenDisabled")
	if err != nil {
		return nil, err
	}
	return &TokenServiceTokenDisabledIterator{contract: _TokenService.contract, event: "TokenDisabled", logs: logs, sub: sub}, nil
}

// WatchTokenDisabled is a free log subscription operation binding the contract event 0x7e853a44c5ec3f34ea62e92332609e2588e70e4300133dce82a820efbc227aab.
//
// Solidity: event TokenDisabled(address token, uint256 destChainId)
func (_TokenService *TokenServiceFilterer) WatchTokenDisabled(opts *bind.WatchOpts, sink chan<- *TokenServiceTokenDisabled) (event.Subscription, error) {

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "TokenDisabled")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServiceTokenDisabled)
				if err := _TokenService.contract.UnpackLog(event, "TokenDisabled", log); err != nil {
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

// ParseTokenDisabled is a log parse operation binding the contract event 0x7e853a44c5ec3f34ea62e92332609e2588e70e4300133dce82a820efbc227aab.
//
// Solidity: event TokenDisabled(address token, uint256 destChainId)
func (_TokenService *TokenServiceFilterer) ParseTokenDisabled(log types.Log) (*TokenServiceTokenDisabled, error) {
	event := new(TokenServiceTokenDisabled)
	if err := _TokenService.contract.UnpackLog(event, "TokenDisabled", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// TokenServiceTokenEnabledIterator is returned from FilterTokenEnabled and is used to iterate over the raw logs and unpacked data for TokenEnabled events raised by the TokenService contract.
type TokenServiceTokenEnabledIterator struct {
	Event *TokenServiceTokenEnabled // Event containing the contract specifics and raw log

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
func (it *TokenServiceTokenEnabledIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServiceTokenEnabled)
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
		it.Event = new(TokenServiceTokenEnabled)
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
func (it *TokenServiceTokenEnabledIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServiceTokenEnabledIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServiceTokenEnabled represents a TokenEnabled event raised by the TokenService contract.
type TokenServiceTokenEnabled struct {
	Token       common.Address
	DestChainId *big.Int
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterTokenEnabled is a free log retrieval operation binding the contract event 0xaf3af7664a431a2f0c37f4bad4e8a1733402871c1a886b85b673ad48353f4ec4.
//
// Solidity: event TokenEnabled(address token, uint256 destChainId)
func (_TokenService *TokenServiceFilterer) FilterTokenEnabled(opts *bind.FilterOpts) (*TokenServiceTokenEnabledIterator, error) {

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "TokenEnabled")
	if err != nil {
		return nil, err
	}
	return &TokenServiceTokenEnabledIterator{contract: _TokenService.contract, event: "TokenEnabled", logs: logs, sub: sub}, nil
}

// WatchTokenEnabled is a free log subscription operation binding the contract event 0xaf3af7664a431a2f0c37f4bad4e8a1733402871c1a886b85b673ad48353f4ec4.
//
// Solidity: event TokenEnabled(address token, uint256 destChainId)
func (_TokenService *TokenServiceFilterer) WatchTokenEnabled(opts *bind.WatchOpts, sink chan<- *TokenServiceTokenEnabled) (event.Subscription, error) {

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "TokenEnabled")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServiceTokenEnabled)
				if err := _TokenService.contract.UnpackLog(event, "TokenEnabled", log); err != nil {
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

// ParseTokenEnabled is a log parse operation binding the contract event 0xaf3af7664a431a2f0c37f4bad4e8a1733402871c1a886b85b673ad48353f4ec4.
//
// Solidity: event TokenEnabled(address token, uint256 destChainId)
func (_TokenService *TokenServiceFilterer) ParseTokenEnabled(log types.Log) (*TokenServiceTokenEnabled, error) {
	event := new(TokenServiceTokenEnabled)
	if err := _TokenService.contract.UnpackLog(event, "TokenEnabled", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// TokenServiceTokenMaxValueUpdatedIterator is returned from FilterTokenMaxValueUpdated and is used to iterate over the raw logs and unpacked data for TokenMaxValueUpdated events raised by the TokenService contract.
type TokenServiceTokenMaxValueUpdatedIterator struct {
	Event *TokenServiceTokenMaxValueUpdated // Event containing the contract specifics and raw log

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
func (it *TokenServiceTokenMaxValueUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServiceTokenMaxValueUpdated)
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
		it.Event = new(TokenServiceTokenMaxValueUpdated)
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
func (it *TokenServiceTokenMaxValueUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServiceTokenMaxValueUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServiceTokenMaxValueUpdated represents a TokenMaxValueUpdated event raised by the TokenService contract.
type TokenServiceTokenMaxValueUpdated struct {
	Token       common.Address
	DestChainId *big.Int
	OldMaxValue *big.Int
	NewMaxValue *big.Int
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterTokenMaxValueUpdated is a free log retrieval operation binding the contract event 0xb9c2d22dbf31b05651eadf1ede6f87e23acf9db9d8d82de6c69d53aa46ecc2c2.
//
// Solidity: event TokenMaxValueUpdated(address token, uint256 destChainId, uint256 oldMaxValue, uint256 newMaxValue)
func (_TokenService *TokenServiceFilterer) FilterTokenMaxValueUpdated(opts *bind.FilterOpts) (*TokenServiceTokenMaxValueUpdatedIterator, error) {

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "TokenMaxValueUpdated")
	if err != nil {
		return nil, err
	}
	return &TokenServiceTokenMaxValueUpdatedIterator{contract: _TokenService.contract, event: "TokenMaxValueUpdated", logs: logs, sub: sub}, nil
}

// WatchTokenMaxValueUpdated is a free log subscription operation binding the contract event 0xb9c2d22dbf31b05651eadf1ede6f87e23acf9db9d8d82de6c69d53aa46ecc2c2.
//
// Solidity: event TokenMaxValueUpdated(address token, uint256 destChainId, uint256 oldMaxValue, uint256 newMaxValue)
func (_TokenService *TokenServiceFilterer) WatchTokenMaxValueUpdated(opts *bind.WatchOpts, sink chan<- *TokenServiceTokenMaxValueUpdated) (event.Subscription, error) {

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "TokenMaxValueUpdated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServiceTokenMaxValueUpdated)
				if err := _TokenService.contract.UnpackLog(event, "TokenMaxValueUpdated", log); err != nil {
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

// ParseTokenMaxValueUpdated is a log parse operation binding the contract event 0xb9c2d22dbf31b05651eadf1ede6f87e23acf9db9d8d82de6c69d53aa46ecc2c2.
//
// Solidity: event TokenMaxValueUpdated(address token, uint256 destChainId, uint256 oldMaxValue, uint256 newMaxValue)
func (_TokenService *TokenServiceFilterer) ParseTokenMaxValueUpdated(log types.Log) (*TokenServiceTokenMaxValueUpdated, error) {
	event := new(TokenServiceTokenMaxValueUpdated)
	if err := _TokenService.contract.UnpackLog(event, "TokenMaxValueUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// TokenServiceTokenMinValueUpdatedIterator is returned from FilterTokenMinValueUpdated and is used to iterate over the raw logs and unpacked data for TokenMinValueUpdated events raised by the TokenService contract.
type TokenServiceTokenMinValueUpdatedIterator struct {
	Event *TokenServiceTokenMinValueUpdated // Event containing the contract specifics and raw log

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
func (it *TokenServiceTokenMinValueUpdatedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServiceTokenMinValueUpdated)
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
		it.Event = new(TokenServiceTokenMinValueUpdated)
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
func (it *TokenServiceTokenMinValueUpdatedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServiceTokenMinValueUpdatedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServiceTokenMinValueUpdated represents a TokenMinValueUpdated event raised by the TokenService contract.
type TokenServiceTokenMinValueUpdated struct {
	Token       common.Address
	DestChainId *big.Int
	OldMinValue *big.Int
	NewMinValue *big.Int
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterTokenMinValueUpdated is a free log retrieval operation binding the contract event 0x4e2746c7657bbec4d53a9c8ae5d432680b93d5a8479882aa161af6e253229ffb.
//
// Solidity: event TokenMinValueUpdated(address token, uint256 destChainId, uint256 oldMinValue, uint256 newMinValue)
func (_TokenService *TokenServiceFilterer) FilterTokenMinValueUpdated(opts *bind.FilterOpts) (*TokenServiceTokenMinValueUpdatedIterator, error) {

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "TokenMinValueUpdated")
	if err != nil {
		return nil, err
	}
	return &TokenServiceTokenMinValueUpdatedIterator{contract: _TokenService.contract, event: "TokenMinValueUpdated", logs: logs, sub: sub}, nil
}

// WatchTokenMinValueUpdated is a free log subscription operation binding the contract event 0x4e2746c7657bbec4d53a9c8ae5d432680b93d5a8479882aa161af6e253229ffb.
//
// Solidity: event TokenMinValueUpdated(address token, uint256 destChainId, uint256 oldMinValue, uint256 newMinValue)
func (_TokenService *TokenServiceFilterer) WatchTokenMinValueUpdated(opts *bind.WatchOpts, sink chan<- *TokenServiceTokenMinValueUpdated) (event.Subscription, error) {

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "TokenMinValueUpdated")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServiceTokenMinValueUpdated)
				if err := _TokenService.contract.UnpackLog(event, "TokenMinValueUpdated", log); err != nil {
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

// ParseTokenMinValueUpdated is a log parse operation binding the contract event 0x4e2746c7657bbec4d53a9c8ae5d432680b93d5a8479882aa161af6e253229ffb.
//
// Solidity: event TokenMinValueUpdated(address token, uint256 destChainId, uint256 oldMinValue, uint256 newMinValue)
func (_TokenService *TokenServiceFilterer) ParseTokenMinValueUpdated(log types.Log) (*TokenServiceTokenMinValueUpdated, error) {
	event := new(TokenServiceTokenMinValueUpdated)
	if err := _TokenService.contract.UnpackLog(event, "TokenMinValueUpdated", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// TokenServiceTokenRemovedIterator is returned from FilterTokenRemoved and is used to iterate over the raw logs and unpacked data for TokenRemoved events raised by the TokenService contract.
type TokenServiceTokenRemovedIterator struct {
	Event *TokenServiceTokenRemoved // Event containing the contract specifics and raw log

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
func (it *TokenServiceTokenRemovedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServiceTokenRemoved)
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
		it.Event = new(TokenServiceTokenRemoved)
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
func (it *TokenServiceTokenRemovedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServiceTokenRemovedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServiceTokenRemoved represents a TokenRemoved event raised by the TokenService contract.
type TokenServiceTokenRemoved struct {
	Token       common.Address
	DestChainId *big.Int
	Raw         types.Log // Blockchain specific contextual infos
}

// FilterTokenRemoved is a free log retrieval operation binding the contract event 0xbe9bb4bdca0a094babd75e3a98b1d2e2390633430d0a2f6e2b9970e2ee03fb2e.
//
// Solidity: event TokenRemoved(address token, uint256 destChainId)
func (_TokenService *TokenServiceFilterer) FilterTokenRemoved(opts *bind.FilterOpts) (*TokenServiceTokenRemovedIterator, error) {

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "TokenRemoved")
	if err != nil {
		return nil, err
	}
	return &TokenServiceTokenRemovedIterator{contract: _TokenService.contract, event: "TokenRemoved", logs: logs, sub: sub}, nil
}

// WatchTokenRemoved is a free log subscription operation binding the contract event 0xbe9bb4bdca0a094babd75e3a98b1d2e2390633430d0a2f6e2b9970e2ee03fb2e.
//
// Solidity: event TokenRemoved(address token, uint256 destChainId)
func (_TokenService *TokenServiceFilterer) WatchTokenRemoved(opts *bind.WatchOpts, sink chan<- *TokenServiceTokenRemoved) (event.Subscription, error) {

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "TokenRemoved")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServiceTokenRemoved)
				if err := _TokenService.contract.UnpackLog(event, "TokenRemoved", log); err != nil {
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

// ParseTokenRemoved is a log parse operation binding the contract event 0xbe9bb4bdca0a094babd75e3a98b1d2e2390633430d0a2f6e2b9970e2ee03fb2e.
//
// Solidity: event TokenRemoved(address token, uint256 destChainId)
func (_TokenService *TokenServiceFilterer) ParseTokenRemoved(log types.Log) (*TokenServiceTokenRemoved, error) {
	event := new(TokenServiceTokenRemoved)
	if err := _TokenService.contract.UnpackLog(event, "TokenRemoved", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// TokenServiceUnpauseIterator is returned from FilterUnpause and is used to iterate over the raw logs and unpacked data for Unpause events raised by the TokenService contract.
type TokenServiceUnpauseIterator struct {
	Event *TokenServiceUnpause // Event containing the contract specifics and raw log

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
func (it *TokenServiceUnpauseIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServiceUnpause)
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
		it.Event = new(TokenServiceUnpause)
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
func (it *TokenServiceUnpauseIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServiceUnpauseIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServiceUnpause represents a Unpause event raised by the TokenService contract.
type TokenServiceUnpause struct {
	Raw types.Log // Blockchain specific contextual infos
}

// FilterUnpause is a free log retrieval operation binding the contract event 0x7805862f689e2f13df9f062ff482ad3ad112aca9e0847911ed832e158c525b33.
//
// Solidity: event Unpause()
func (_TokenService *TokenServiceFilterer) FilterUnpause(opts *bind.FilterOpts) (*TokenServiceUnpauseIterator, error) {

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "Unpause")
	if err != nil {
		return nil, err
	}
	return &TokenServiceUnpauseIterator{contract: _TokenService.contract, event: "Unpause", logs: logs, sub: sub}, nil
}

// WatchUnpause is a free log subscription operation binding the contract event 0x7805862f689e2f13df9f062ff482ad3ad112aca9e0847911ed832e158c525b33.
//
// Solidity: event Unpause()
func (_TokenService *TokenServiceFilterer) WatchUnpause(opts *bind.WatchOpts, sink chan<- *TokenServiceUnpause) (event.Subscription, error) {

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "Unpause")
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServiceUnpause)
				if err := _TokenService.contract.UnpackLog(event, "Unpause", log); err != nil {
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

// ParseUnpause is a log parse operation binding the contract event 0x7805862f689e2f13df9f062ff482ad3ad112aca9e0847911ed832e158c525b33.
//
// Solidity: event Unpause()
func (_TokenService *TokenServiceFilterer) ParseUnpause(log types.Log) (*TokenServiceUnpause, error) {
	event := new(TokenServiceUnpause)
	if err := _TokenService.contract.UnpackLog(event, "Unpause", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// TokenServiceUpgradedIterator is returned from FilterUpgraded and is used to iterate over the raw logs and unpacked data for Upgraded events raised by the TokenService contract.
type TokenServiceUpgradedIterator struct {
	Event *TokenServiceUpgraded // Event containing the contract specifics and raw log

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
func (it *TokenServiceUpgradedIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(TokenServiceUpgraded)
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
		it.Event = new(TokenServiceUpgraded)
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
func (it *TokenServiceUpgradedIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *TokenServiceUpgradedIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// TokenServiceUpgraded represents a Upgraded event raised by the TokenService contract.
type TokenServiceUpgraded struct {
	Implementation common.Address
	Raw            types.Log // Blockchain specific contextual infos
}

// FilterUpgraded is a free log retrieval operation binding the contract event 0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b.
//
// Solidity: event Upgraded(address indexed implementation)
func (_TokenService *TokenServiceFilterer) FilterUpgraded(opts *bind.FilterOpts, implementation []common.Address) (*TokenServiceUpgradedIterator, error) {

	var implementationRule []interface{}
	for _, implementationItem := range implementation {
		implementationRule = append(implementationRule, implementationItem)
	}

	logs, sub, err := _TokenService.contract.FilterLogs(opts, "Upgraded", implementationRule)
	if err != nil {
		return nil, err
	}
	return &TokenServiceUpgradedIterator{contract: _TokenService.contract, event: "Upgraded", logs: logs, sub: sub}, nil
}

// WatchUpgraded is a free log subscription operation binding the contract event 0xbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b.
//
// Solidity: event Upgraded(address indexed implementation)
func (_TokenService *TokenServiceFilterer) WatchUpgraded(opts *bind.WatchOpts, sink chan<- *TokenServiceUpgraded, implementation []common.Address) (event.Subscription, error) {

	var implementationRule []interface{}
	for _, implementationItem := range implementation {
		implementationRule = append(implementationRule, implementationItem)
	}

	logs, sub, err := _TokenService.contract.WatchLogs(opts, "Upgraded", implementationRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(TokenServiceUpgraded)
				if err := _TokenService.contract.UnpackLog(event, "Upgraded", log); err != nil {
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
func (_TokenService *TokenServiceFilterer) ParseUpgraded(log types.Log) (*TokenServiceUpgraded, error) {
	event := new(TokenServiceUpgraded)
	if err := _TokenService.contract.UnpackLog(event, "Upgraded", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
