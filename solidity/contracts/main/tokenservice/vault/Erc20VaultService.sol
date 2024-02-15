// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IIERC20} from "../../../common/interface/tokenservice/IIERC20.sol";
import {VaultService} from "../../../base/tokenservice/VaultService.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";

contract Erc20VaultService is VaultService, Upgradeable {
    
    function Erc20VaultService_init(
        address _token,
        string memory _name
    ) public initializer {
        require(_token != address(0), "Only ERC20 Address");
        __VaultService_init(_token, _name);
    }

    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == owner());
    }

    function transfer(uint256 amount) external onlyOwner returns (bool) {
        require(IIERC20(token()).transfer(owner(), amount), "ERC20 Transfer Failed");
        return true;
    }
}