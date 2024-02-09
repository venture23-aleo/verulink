// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {VaultService} from "../../../base/tokenservice/VaultService.sol";
import {Initializable} from "@thirdweb-dev/contracts/extension/Initializable.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";

contract EthVaultService is VaultService, Initializable, Upgradeable {
    
    function initialize(
        string memory _name,
        address _owner
    ) public initializer {
        super._initialize(address(0),_name, _owner);
    }

    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == _owner_);
    }

    function transfer(uint256 amount) external onlyOwner returns (bool) {
        (bool sent,) = owner().call{value: amount}("");
        require(sent, "ETH approval Failed");
        return true;
    }
}