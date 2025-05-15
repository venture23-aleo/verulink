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
    bytes32 public constant DEFAULT = keccak256("TOKEN_SERVICE_ROLE");
    
    // Storage variables
    mapping(address => uint256) public platformFees;
    mapping(address => uint256) public relayerFees;
    mapping(address => uint256) public privatePlatformFees;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the contract (replaces constructor)
    /// @param _tokenService The address of the token service
    /// @param _owner The address of the contract owner
    function initialize(
        address _tokenService,
        address _owner
    ) public initializer {
        __AccessControl_init();
        
        _setupRole(TOKEN_SERVICE_ROLE, _tokenService);
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
    }

    /// @notice Sets the fees for the platform
    /// @param _addr The address of the registered token
    /// @param _platformFee The fees for the platform
    /// @param _privateFee The fees for the private bridge
    function setPlatformFees(address _addr, uint256 _platformFee, uint256 _privateFee) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_platformFee <= 100000, "FeeCollector: invalidPlatformFee");
        require(_privateFee <= 100000, "FeeCollector: invalidPrivatePlatformFee");

        require(platformFees[_addr] != _platformFee, "FeeCollector: platformFeeAlreadySet");
        require(privatePlatformFees[_addr] != _privateFee, "FeeCollector: privatePlatformFeeAlreadySet");

        platformFees[_addr] = _platformFee;
        privatePlatformFees[_addr] = _privateFee;
    }

    /// @notice Sets the fees for the relayer
    /// @param _addr The address of the registered token
    /// @param _relayerFee The fees for the relayer
    function setRelayerFees(address _addr, uint256 _relayerFee) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(relayerFees[_addr] != _relayerFee, "FeeCollector: relayerFeeAlreadySet");
        relayerFees[_addr] = _relayerFee;
    }

    /// @notice Withdraws the protocol fees collected for a specific token
    /// @param _addr The address of the registered token
    /// @param _to The address to withdraw the fees to
    function withdrawProtocolFees(address _addr, address _to) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_to != address(0), "FeeCollector: cannotWithdrawToZeroAddress");
        if (_addr == address(1)) {
            uint256 amount = address(this).balance;
            require(amount > 0, "FeeCollector: noETHFeesToWithdraw");
            (bool sent, ) = payable(_to).call{value: amount}("");
            require(sent, "FeeCollector: ethWithdrawFailed");
        } else {
            uint256 amount = IIERC20(_addr).balanceOf(address(this));
            require(amount > 0, "FeeCollector: noTokenFeesToWithdraw");
            IIERC20(_addr).safeTransfer(_to, amount);
        }
    }

    /// @notice Function that allows the contract to receive ETH
    receive() external payable virtual onlyRole(TOKEN_SERVICE_ROLE) {}

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[50] private __gap;
}