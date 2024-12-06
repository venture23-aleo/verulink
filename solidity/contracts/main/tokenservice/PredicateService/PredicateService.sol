// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {PredicateClient} from "@predicate/contracts/src/mixins/PredicateClient.sol";
import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
import {IPredicateManager} from "@predicate/contracts/src/interfaces/IPredicateManager.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title PredicateService
/// @notice A contract for predicate-based authorization
/// @dev Inherits PredicateClient and provides verification functions for secure transactions.
contract PredicateService is PredicateClient, AccessControl {
    /// @notice Constructor sets the deployer as the DEFAULT_ADMIN_ROLE and assigns SERVICE_ROLE
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    bytes32 public constant SERVICE_ROLE =
        0xd8a7a79547af723ee3e12b59a480111268d8969c634e1a34a144d2c8b91d635b;

    /// @notice Verifies predicate for a transaction with receiver and predicate for ETH message.
    /// @param receiver The intended receiver address of the transaction.
    /// @param predicateMessage The predicate message to verify authorization.
    function handlePredicateMessage(
        string memory receiver,
        PredicateMessage calldata predicateMessage
    ) public onlyRole(SERVICE_ROLE) returns (bool) {
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
    function handlePredicateMessage(
        address tokenAddress,
        uint256 amount,
        string memory receiver,
        PredicateMessage calldata predicateMessage
    ) public onlyRole(SERVICE_ROLE) returns (bool) {
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
    function setPolicy(string memory _policyID) external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        policyID = _policyID;
        serviceManager.setPolicy(_policyID);
    }

    /**
     * @notice Function for setting the ServiceManager
     * @param _serviceManager address of the service manager
     */
    function setPredicateManager(
        address _serviceManager
    ) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        serviceManager = IPredicateManager(_serviceManager);
    }
}
