// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IVaultService} from "../../common/interface/tokenservice/IVaultService.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


/// @title VaultService
/// @dev Abstract contract providing basic functionality for a vault service
abstract contract VaultService is IVaultService, OwnableUpgradeable {

    /// @notice Address of the associated token
    address public token;

    /// @notice Name of the vault service
    string public name;

    /// @notice Initializes the VaultService contract with the specified token address and name
    /// @param _token The address of the associated token
    /// @param _name The name of the vault service
    function __VaultService_init(
        address _token,
        string memory _name
    ) internal {
        __Ownable_init_unchained();
        token = _token;
        name = _name;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}