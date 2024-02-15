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
        __Ownable_init();
        _token_ = _token;
        _name_ = _name;
    }

    function token() public view returns (address) {
        return _token_;
    }

    function name() public view returns (string memory) {
        return _name_;
    }
}