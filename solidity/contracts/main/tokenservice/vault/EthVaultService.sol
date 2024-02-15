// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {VaultService} from "../../../base/tokenservice/VaultService.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";

contract EthVaultService is VaultService, Upgradeable {
    
    function EthVaultService_init(
        string memory _name
    ) public initializer {
        __VaultService_init(address(0),_name);
    }

    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == owner());
    }

    function transfer(uint256 amount) external onlyOwner returns (bool) {
        (bool sent,) = owner().call{value: amount}("");
        require(sent, "ETH approval Failed");
        return true;
    }
}