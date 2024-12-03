// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {PredicateService} from "./PredicateService.sol";
import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
import {IPredicateManager} from "@predicate/contracts/src/interfaces/IPredicateManager.sol";

/// @title VerulinkPredicate
/// @notice A contract that implements predicate-based authorization for Verulink use cases
/// @dev Inherits PredicateService and provides functions for handling Verulink-specific predicates
contract VerulinkPredicate is PredicateService {
    /// @notice Handles predicate authorization for ETH transactions
    /// @param receiver The intended receiver address of the transaction
    /// @param predicateMessage The predicate message to verify authorization
    function handleVerulinkPredicate(
        string memory receiver,
        PredicateMessage calldata predicateMessage
    ) external payable {
        // Use PredicateService's predicate verification logic
        require(
            _handlePredicateMessage(receiver, predicateMessage),
            "VerulinkPredicate: unauthorized ETH transaction"
        );
    }

    /// @notice Handles predicate authorization for ERC20 token transactions
    /// @param tokenAddress The address of the ERC20 token
    /// @param amount The amount of tokens to be transferred
    /// @param receiver The intended receiver address of the transaction
    /// @param predicateMessage The predicate message to verify authorization
    function handleVerulinkPredicate(
        address tokenAddress,
        uint256 amount,
        string memory receiver,
        PredicateMessage calldata predicateMessage
    ) external {
        // Use PredicateService's predicate verification logic
        require(
            _handlePredicateMessage(
                tokenAddress,
                amount,
                receiver,
                predicateMessage
            ),
            "VerulinkPredicate: unauthorized ERC20 transaction"
        );
    }

    /**
     * @notice Updates the policy ID
     * @param _policyID policy ID from onchain
     */
    function setPolicy(string memory _policyID) external override onlyOwner {
        policyID = _policyID;
        serviceManager.setPolicy(_policyID);
    }

    /**
     * @notice Function for setting the ServiceManager
     * @param _serviceManager address of the service manager
     */
    function setPredicateManager(address _serviceManager) public override onlyOwner {
        serviceManager = IPredicateManager(_serviceManager);
    }
}
