// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IIERC20} from "../../../common/interface/tokenservice/IIERC20.sol";
import {VaultService} from "../../../base/tokenservice/VaultService.sol";
import {Initializable} from "@thirdweb-dev/contracts/extension/Initializable.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";

contract Erc20VaultService is VaultService, Initializable, Upgradeable {
    
    function initialize(
        address _token,
        string memory _name,
        address _owner
    ) public initializer {
        require(_token != address(0), "Only ERC20 Address");
        super._initialize(_token, _name, _owner);
    }

    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == _owner_);
    }

    function transfer(uint256 amount) public override onlyOwner returns (bool) {
        require(IIERC20(token()).transfer(owner(), amount), "ERC20 Transfer Failed");
        return true;
    }
}