// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

/// @title IVaultService
/// @dev Interface for interacting with a Vault Service.
interface IVaultService {
    
    /// @notice Returns the address of the associated token.
    /// @return address of the token.
    function token() external view returns (address);

    /// @notice Returns the name of the Vault Service.
    /// @return name of the Vault Service.
    function name() external view returns (string memory);

    /// @notice Transfers a specified amount of tokens.
    /// @param amount The amount of tokens to transfer.
    /// @return boolean indicating whether the transfer was successful.
    function transfer(uint256 amount) external returns (bool);
}