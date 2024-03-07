// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

/// @title IVaultService
/// @dev Interface for interacting with a Vault Service.
interface IVaultService {
    /// @notice Transfers a specified amount of tokens.
    /// @param amount The amount of tokens to transfer.
    /// @return boolean indicating whether the transfer was successful.
    function transfer(uint256 amount) external returns (bool);
}