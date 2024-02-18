// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

/// @title IBlackListService
/// @dev Interface for a service that checks whether an account is blacklisted
interface IBlackListService {

    /// @notice Checks if an account is blacklisted
    /// @param account The address to be checked
    /// @return True if the account is blacklisted, false otherwise
    function isBlackListed(address account) external view returns (bool);
}