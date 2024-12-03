// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {PredicateClient} from "@predicate/contracts/src/mixins/PredicateClient.sol";
import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
import {IPredicateManager} from "@predicate/contracts/src/interfaces/IPredicateManager.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title PredicateService
/// @notice An abstract contract for predicate-based authorization
/// @dev Inherits PredicateClient and provides verification functions for secure transactions.
abstract contract PredicateService is PredicateClient, OwnableUpgradeable {
    /// @notice Verifies predicate for a transaction with receiver and predicate for ETH message.
    /// @param receiver The intended receiver address of the transaction.
    /// @param predicateMessage The predicate message to verify authorization.
    function _handlePredicateMessage(
        string memory receiver,
        PredicateMessage calldata predicateMessage
    ) internal returns (bool) {
        bytes memory encodedSigAndArgs = abi.encodeWithSignature(
            "_transfer(string)",
            receiver
        );
        require(
            _authorizeTransaction(predicateMessage, encodedSigAndArgs),
            "PredicateService: unauthorized transaction"
        );
        return true;
    }

    /// @notice Verifies predicate for a transaction with receiver, amount, and predicate message.
    /// @param receiver The intended receiver address of the transaction.
    /// @param predicateMessage The predicate message to verify authorization.
    /// @param amount The amount required for the transaction.
    function _handlePredicateMessage(
        address tokenAddress,
        uint256 amount,
        string memory receiver,
        PredicateMessage calldata predicateMessage
    ) internal returns (bool) {
        bytes memory encodedSigAndArgs = abi.encodeWithSignature(
            "_transfer(address,uint256,string)",
            tokenAddress,
            amount,
            receiver
        );
        require(
            _authorizeTransaction(predicateMessage, encodedSigAndArgs),
            "PredicateService: unauthorized transaction"
        );
        return true;
    }

    /**
     * @notice Updates the policy ID
     * @param _policyID policy ID from onchain
     */
    function setPolicy(string memory _policyID) external virtual onlyOwner {
        policyID = _policyID;
        serviceManager.setPolicy(_policyID);
    }

    /**
     * @notice Function for setting the ServiceManager
     * @param _serviceManager address of the service manager
     */
    function setPredicateManager(address _serviceManager) public virtual onlyOwner {
        serviceManager = IPredicateManager(_serviceManager);
    }
}
