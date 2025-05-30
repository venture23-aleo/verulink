// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";

/// @title FeeCollector Contract
/// @dev Handles platform and executor fees logic with transparent upgrade capability
contract FeeCollector is Initializable, AccessControlUpgradeable {
    using SafeERC20 for IIERC20;

    bytes32 public constant TOKEN_SERVICE_ROLE = keccak256("TOKEN_SERVICE_ROLE");
    
    // Storage variables
    mapping(address => uint256) public platformFees;
    mapping(address => uint256) public privatePlatformFees;

    mapping(address => uint256) public relayerFees;
    mapping(address => uint256) public privateRelayerFees;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract (replaces constructor)
    /// @param _tokenService The address of the token service
    /// @param _owner The address of the contract owner
    /// @param usdcAddress The address of the USDC token
    /// @param usdtAddress The address of the USDT token
    /// @param _publicFees The fees for the public transfer in 3decimals number (For 1% = 1000)
    /// @param _privateFees The fees for the private transfer in 3decimals number (For 1% = 1000)
    function initialize(
        address _tokenService,
        address _owner,
        address usdcAddress,
        address usdtAddress,
        uint256 _publicFees,
        uint256 _privateFees
    ) public initializer {
        __AccessControl_init();
        
        _setupRole(TOKEN_SERVICE_ROLE, _tokenService);
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);

        platformFees[address(1)] = _publicFees;
        privatePlatformFees[address(1)] = _privateFees;

        platformFees[usdcAddress] = _publicFees;
        privatePlatformFees[usdcAddress] = _privateFees;

        platformFees[usdtAddress] = _publicFees;
        privatePlatformFees[usdtAddress] = _privateFees;
    }

    /// @notice Sets the fees for the platform
    /// @param _addr The address of the registered token
    /// @param _platformFee The fees for the platform in 3decimals number (For 1% = 1000)
    function setPlatformFees(address _addr, uint256 _platformFee) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_platformFee <= 100000, "FeeCollector: invalidPlatformFee");
        require(platformFees[_addr] != _platformFee, "FeeCollector: platformFeeAlreadySet");

        platformFees[_addr] = _platformFee;
    }

    /// @notice Sets the private platform fees for a specific token
    /// @param _addr The address of the registered token
    /// @param _privatePlatformFee The private platform fees in 3decimals number (For 1% = 1000)
    function setPrivatePlatformFees(address _addr, uint256 _privatePlatformFee) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_privatePlatformFee <= 100000, "FeeCollector: invalidPrivatePlatformFee");
        require(privatePlatformFees[_addr] != _privatePlatformFee, "FeeCollector: privatePlatformFeeAlreadySet");
        privatePlatformFees[_addr] = _privatePlatformFee;
    }

    /// @notice Sets the fees for the relayer
    /// @param _addr The address of the registered token
    /// @param _relayerFee The flat fees for the relayer
    function setRelayerFees(address _addr, uint256 _relayerFee) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(relayerFees[_addr] != _relayerFee, "FeeCollector: publicRelayerFeeAlreadySet");
        relayerFees[_addr] = _relayerFee;
    }

    /// @notice Sets the private relayer fees for a specific token
    /// @param _addr The address of the registered token
    /// @param _privateRelayerFee The private flat relayer fees to be set
    function setPrivateRelayerFees(address _addr, uint256 _privateRelayerFee) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(privateRelayerFees[_addr] != _privateRelayerFee, "FeeCollector: privateRelayerFeeAlreadySet");
        privateRelayerFees[_addr] = _privateRelayerFee;
    }

    /// @notice Withdraws the protocol fees collected for a specific token
    /// @param _tokenAddr The address of the registered token
    /// @param _receiverAddr The address to withdraw the fees to
    function withdrawProtocolFees(address _tokenAddr, address _receiverAddr) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_receiverAddr != address(0), "FeeCollector: cannotWithdrawToZeroAddress");
        if (_tokenAddr == address(1)) {
            uint256 amount = address(this).balance;
            require(amount > 0, "FeeCollector: noETHFeesToWithdraw");
            (bool sent, ) = payable(_receiverAddr).call{value: amount}("");
            require(sent, "FeeCollector: ethWithdrawFailed");
        } else {
            uint256 amount = IIERC20(_tokenAddr).balanceOf(address(this));
            require(amount > 0, "FeeCollector: noTokenFeesToWithdraw");
            IIERC20(_tokenAddr).safeTransfer(_receiverAddr, amount);
        }
    }

    receive() external payable virtual onlyRole(TOKEN_SERVICE_ROLE) {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}