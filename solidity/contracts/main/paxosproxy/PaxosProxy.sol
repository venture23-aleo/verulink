// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
import {ITellerWithMultiAssetSupport} from "../../common/interface/paxos/ITellerWithMultiAssetSupport.sol";
import {ITokenService} from "../../common/interface/paxos/ITokenService.sol";

/// @title PaxosProxy
/// @dev Bundles: (1) deposit into BoringVault via deposit, (2) bridge minted vault token via TokenServiceV3

contract PaxosProxy is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev BoringVault Teller instance
    ITellerWithMultiAssetSupport public immutable teller;
    /// @dev The vault share token returned by boring vault (aleoUSD)
    IERC20 public immutable aleoUSD;
    /// @dev TokenServiceV3 instance used to bridge
    ITokenService public immutable tokenService;

    event DepositAndBridge(
        address indexed user,
        address indexed depositAsset,
        uint256 assetsIn,
        uint256 sharesOut,
        string receiver
    );

    constructor(
        address _teller,
        address _aleoUSD,
        address _tokenService
    ) {
        require(_teller != address(0) && _aleoUSD != address(0) && _tokenService != address(0), "PaxosProxy: zeroAddress");
        teller = ITellerWithMultiAssetSupport(_teller);
        aleoUSD = IERC20(_aleoUSD);
        tokenService = ITokenService(_tokenService);
    }

    /// @notice Pulls user's deposit asset, deposits to BoringVault via enter, bridges minted aleoUSD via TokenServiceV3
    /// @param depositAsset ERC20 asset to deposit into the vault
    /// @param amount Amount of deposit asset to transfer and enter with
    /// @param minimumShares Minimum acceptable shares minted (slippage guard)
    /// @param receiver Aleo address on destination chain
    /// @param isRelayerOn Whether relayer mode is on in TokenServiceV3
    /// @param data Extra metadata for bridge
    /// @return sharesMinted The number of aleoUSD minted and bridged
    function depositAndBridge(
        address depositAsset,
        uint256 amount,
        uint256 minimumShares,
        string calldata receiver,
        bool isRelayerOn,
        bytes calldata data
    ) external nonReentrant returns (uint256 sharesMinted) {

        require(depositAsset != address(0) && teller.isSupported(depositAsset), "PaxosProxy: invalidAsset");
        require(amount > 0, "PaxosProxy: amountZero");

        IERC20 depositToken = IERC20(depositAsset);

        // 1) Pull funds from user
        depositToken.safeTransferFrom(msg.sender, address(this), amount);

        // 2) Deposit into vault
        depositToken.safeIncreaseAllowance(address(teller), amount);
        sharesMinted = teller.deposit(address(depositToken), amount, minimumShares);
        depositToken.safeApprove(address(teller), 0);

        // 3) Approve TokenServiceV3 to pull aleoUSD and bridge
        aleoUSD.safeIncreaseAllowance(address(tokenService), sharesMinted);
        tokenService.transfer(address(aleoUSD), sharesMinted, receiver, isRelayerOn, data);
        aleoUSD.safeApprove(address(tokenService), 0);

        emit DepositAndBridge(msg.sender, depositAsset, amount, sharesMinted, receiver);
    }
}