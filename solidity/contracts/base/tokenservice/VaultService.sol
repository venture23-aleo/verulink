// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IVaultService} from "../../common/interface/tokenservice/IVaultService.sol";
import {Ownable} from "../../common/Ownable.sol";

abstract contract VaultService is IVaultService, Ownable {

    address private _token_;
    string private _name_;

    function _initialize(
        address _token,
        string memory _name,
        address _owner
    ) internal {
        super._initialize(_owner);
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