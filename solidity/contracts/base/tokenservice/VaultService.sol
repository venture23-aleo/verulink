// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IVaultService} from "../../common/interface/tokenservice/IVaultService.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";


/// @title VaultService
/// @dev Abstract contract providing basic functionality for a vault service
abstract contract VaultService is IVaultService, OwnableUpgradeable {

    /// @notice Address of the associated token
    address private _token_;

    /// @notice Name of the vault service
    string private _name_;

    /// @notice Initializes the VaultService contract with the specified token address and name
    /// @param _token The address of the associated token
    /// @param _name The name of the vault service
    function __VaultService_init(
        address _token,
        string memory _name
    ) internal onlyInitializing {
        __Ownable_init_unchained();
        _token_ = _token;
        _name_ = _name;
    }

    // function __VaultService_init_unchained(
    //     address _token,
    //     string memory _name
    // ) internal onlyInitializing {
    //     _token_ = _token;
    //     _name_ = _name;
    // }

    /// @notice Gets the address of the associated token
    /// @return address of the token
    function token() public virtual view returns (address) {
        return _token_;
    }

    /// @notice Gets the name of the vault service
    /// @return name of the vault service
    function name() public virtual view returns (string memory) {
        return _name_;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}