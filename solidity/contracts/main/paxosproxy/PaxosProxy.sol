// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";

import {IBoringVault} from "../../common/interface/paxos/IBoringVault.sol";

/// @title PaxosProxy
/// @dev Bundles: (1) deposit into BoringVault via enter, (2) bridge minted vault token via TokenServiceV3
interface ITokenServiceV3 {
    function transfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver,
        PredicateMessage calldata predicateMessage,
        bool isRelayerOn,
        bytes calldata data
    ) external;
}

contract PaxosProxy is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev BoringVault instance
    IBoringVault public immutable boringVault;
    /// @dev The vault share token returned by enter (aleoUSD)
    IERC20 public immutable aleoUSD;
    /// @dev TokenServiceV3 instance used to bridge
    ITokenServiceV3 public immutable tokenService;

    event DepositAndBridge(
        address indexed user,
        address indexed depositAsset,
        uint256 assetsIn,
        uint256 sharesOut,
        string receiver
    );

    constructor(
        address _boringVault,
        address _aleoUSD,
        address _tokenService
    ) {
        require(_boringVault != address(0) && _aleoUSD != address(0) && _tokenService != address(0), "PaxosProxy: zeroAddress");
        boringVault = IBoringVault(_boringVault);
        aleoUSD = IERC20(_aleoUSD);
        tokenService = ITokenServiceV3(_tokenService);
    }

    /// @notice Pulls user's deposit asset, deposits to BoringVault via enter, bridges minted aleoUSD via TokenServiceV3
    /// @param depositAsset ERC20 asset to deposit into the vault
    /// @param amount Amount of deposit asset to transfer and enter with
    /// @param minimumShares Minimum acceptable shares minted (slippage guard)
    /// @param receiver Aleo address on destination chain
    /// @param predicateMessage Predicate proof for TokenServiceV3
    /// @param isRelayerOn Whether relayer mode is on in TokenServiceV3
    /// @param data Extra metadata for bridge
    /// @return sharesMinted The number of aleoUSD minted and bridged
    function depositAndBridge(
        address depositAsset,
        uint256 amount,
        uint256 minimumShares,
        string calldata receiver,
        PredicateMessage calldata predicateMessage,
        bool isRelayerOn,
        bytes calldata data
    ) external nonReentrant returns (uint256 sharesMinted) {
        require(depositAsset != address(0), "PaxosProxy: invalidAsset");
        require(amount > 0, "PaxosProxy: amountZero");

        IERC20 depositToken = IERC20(depositAsset);

        // 1) Pull funds from user
        depositToken.safeTransferFrom(msg.sender, address(this), amount);

        // 2) Enter vault; measure shares by balance delta (enter does not return amount)
        uint256 beforeShares = aleoUSD.balanceOf(address(this));
        depositToken.safeIncreaseAllowance(address(boringVault), amount);
        boringVault.enter(address(this), depositToken, amount, address(this), minimumShares);
        depositToken.safeApprove(address(boringVault), 0);
        uint256 afterShares = aleoUSD.balanceOf(address(this));
        require(afterShares >= beforeShares, "PaxosProxy: invalidShares");
        sharesMinted = afterShares - beforeShares;
        require(sharesMinted >= minimumShares, "PaxosProxy: slippage");

        // 3) Approve TokenServiceV3 to pull aleoUSD and bridge
        aleoUSD.safeIncreaseAllowance(address(tokenService), sharesMinted);
        tokenService.transfer(address(aleoUSD), sharesMinted, receiver, predicateMessage, isRelayerOn, data);
        aleoUSD.safeApprove(address(tokenService), 0);

        emit DepositAndBridge(msg.sender, depositAsset, amount, sharesMinted, receiver);
    }
}