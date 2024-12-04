// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {TokenService} from "../../main/tokenservice/TokenService.sol";
import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
// import {PredicateService} from "../../main/tokenservice/PredicateService/PredicateService.sol";
import {VerulinkPredicate} from "../../main/tokenservice/PredicateService/VerulinkPredicate.sol";

/// @title TokenServiceV2 Contract
/// @dev Inherits TokenService and PredicateService for predicate-based authorization
contract TokenServiceV2 is TokenService {
    using SafeERC20 for IIERC20;

    using SafeERC20 for IIERC20;

    /// @notice Sets the VerulinkPredicate contract for predicate-based authorization, callable by owner only
    /// @param _verulinkPredicate Address of the VerulinkPredicate contract
    function setVerulinkPredicate(
        VerulinkPredicate _verulinkPredicate
    ) external virtual onlyOwner {
        verulinkpredicate = _verulinkPredicate;
    }

    /// @notice Overrides the ETH transfer function from TokenService to always revert
    /// @dev This is inherited from the base contract but now always reverts.
    function transfer(
        string memory
    ) public payable virtual override whenNotPaused nonReentrant {
        revert("TokenServiceV2: Base transfer function is disabled");
    }

    /// @notice Overrides the ERC20 transfer function from TokenService to always revert
    /// @dev This is inherited from the base contract but now always reverts.
    function transfer(
        address,
        uint256,
        string memory
    ) public virtual override whenNotPaused nonReentrant {
        revert("TokenServiceV2: Base transfer function is disabled");
    }

    /// @notice Transfers ETH with predicate authorization
    /// @param receiver The intended receiver of the transferred ETH
    /// @param predicateMessage Predicate authorization message
    function transfer(
        string calldata receiver,
        PredicateMessage calldata predicateMessage
    ) public payable virtual whenNotPaused nonReentrant {
        // Handle predicate verification
        verulinkpredicate.handleVerulinkPredicate(receiver, predicateMessage);

        // Perform ETH transfer
        _transferWithPredicate(receiver);
    }

    /// @notice Internal function to handle ETH transfers
    /// @param receiver The intended receiver of the ETH
    function _transferWithPredicate(string memory receiver) internal virtual {
        require(
            erc20Bridge.validateAleoAddress(receiver),
            "Invalid receiver address"
        );
        erc20Bridge.sendMessage(_packetify(ETH_TOKEN, msg.value, receiver));
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
        verulinkpredicate.handleVerulinkPredicate(
            tokenAddress,
            amount,
            receiver,
            predicateMessage
        );

        // Perform ERC20 token transfer
        _transferWithPredicate(tokenAddress, amount, receiver);
    }

    /// @notice Internal function to handle ERC20 transfers
    /// @param tokenAddress The address of the ERC20 token
    /// @param amount Amount of tokens to be transferred
    /// @param receiver The intended receiver of the tokens
    function _transferWithPredicate(
        address tokenAddress,
        uint256 amount,
        string calldata receiver
    ) internal virtual {
        require(
            erc20Bridge.validateAleoAddress(receiver),
            "Invalid receiver address"
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

    VerulinkPredicate verulinkpredicate;
}
