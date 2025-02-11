// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {TokenService} from "../../main/tokenservice/TokenService.sol";
import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
import {PredicateService} from "../../main/tokenservice/predicate/PredicateService.sol";

/// @title TokenServiceV2 Contract
/// @dev Inherits TokenService and PredicateService for predicate-based authorization
contract TokenServiceV2 is TokenService {
    using SafeERC20 for IIERC20;

    using SafeERC20 for IIERC20;

    /// @notice Sets the VerulinkPredicate contract for predicate-based authorization, callable by owner only
    /// @param _predicateservice Address of the VerulinkPredicate contract
    function setPredicateService(
        PredicateService _predicateservice
    ) external virtual onlyOwner {
        predicateservice = _predicateservice;
    }

    /// @notice Enables or disables predicate-based authorization, callable by owner only
    function enablePredicate() external virtual onlyOwner {
        require(!isPredicateEnabled, "TokenService: PredicateAuthorizationAlreadyEnabled");
        isPredicateEnabled = true;
    }

    function disablePredicate() external virtual onlyOwner {
        require(isPredicateEnabled, "TokenService: PredicateAuthorizationAlreadyDisabled");
        isPredicateEnabled = false;
    }

    /// @notice Overrides the ETH transfer function from TokenService to always revert
    /// @dev This is inherited from the base contract but now always reverts.
    function transfer(
        string memory receiver
    ) public payable virtual override {
        require(!isPredicateEnabled, "TokenService: PredicateAuthorizationEnabled");
        _transfer(receiver);
    }

    /// @notice Overrides the ERC20 transfer function from TokenService to always revert
    /// @dev This is inherited from the base contract but now always reverts.
    function transfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver
    ) public virtual override {
        require(!isPredicateEnabled, "TokenService: PredicateAuthorizationEnabled");
        _transfer(tokenAddress, amount, receiver);
    }

    /// @notice Transfers ETH with predicate authorization
    /// @param receiver The intended receiver of the transferred ETH
    /// @param predicateMessage Predicate authorization message
    function transfer(
        string calldata receiver,
        PredicateMessage calldata predicateMessage
    ) public payable virtual whenNotPaused nonReentrant {
        // Handle predicate verification
        require(isPredicateEnabled, "TokenService: PredicateAuthorizationDisabled");
        require(predicateservice.handleMessage(
            receiver, 
            predicateMessage, 
            msg.sender, 
            msg.value),
            "TokenService: unauthorizedFromPredicate") ;

        // Perform ETH transfer
        _transfer(receiver);
    }

    /// @notice Transfers ERC20 tokens with predicate authorization
    /// @param tokenAddress The address of the ERC20 token
    /// @param amount Amount of tokens to be transferred
    /// @param receiver The intended receiver of the transferred tokens
    /// @param predicateMessage Predicate authorization message
    function transfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver,
        PredicateMessage calldata predicateMessage
    ) external virtual whenNotPaused nonReentrant {
        // Handle predicate verification
        require(isPredicateEnabled, "TokenService: PredicateAuthorizationDisabled");
        require(predicateservice.handleMessage(
            tokenAddress,
            amount,
            receiver,
            predicateMessage,
            msg.sender,
            0
        ), "TokenService: unauthorized from Predicate");

        // Perform ERC20 token transfer
        _transfer(tokenAddress, amount, receiver);
    }

    /// @notice Internal function to handle ETH transfers
    /// @param receiver The intended receiver of the ETH
    function _transfer(string memory receiver) internal virtual {
        require(
            erc20Bridge.validateAleoAddress(receiver),
            "TokenService: Invalid receiver address"
        );
        erc20Bridge.sendMessage(_packetify(ETH_TOKEN, msg.value, receiver));
    }

    /// @notice Internal function to handle ERC20 transfers
    /// @param tokenAddress The address of the ERC20 token
    /// @param amount Amount of tokens to be transferred
    /// @param receiver The intended receiver of the tokens
    function _transfer(
        address tokenAddress,
        uint256 amount,
        string calldata receiver
    ) internal virtual {
        require(
            erc20Bridge.validateAleoAddress(receiver),
            "TokenService: Invalid receiver address"
        );
        require(tokenAddress != ETH_TOKEN, "ETH transfer not allowed here");

        // Transfer tokens to this contract
        IIERC20(tokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        // Send message via bridge
        erc20Bridge.sendMessage(_packetify(tokenAddress, amount, receiver));
    }

    /**
     * @dev Reserved storage for future upgrades
     */
    uint256[49] private __gap;

    PredicateService public predicateservice;
}
