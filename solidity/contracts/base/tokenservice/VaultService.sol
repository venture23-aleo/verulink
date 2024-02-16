// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IVaultService} from "../../common/interface/tokenservice/IVaultService.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract VaultService is IVaultService, OwnableUpgradeable {

    address private _token_;
    string private _name_;

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

    function token() public virtual view returns (address) {
        return _token_;
    }

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