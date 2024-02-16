// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {VaultService} from "../../../base/tokenservice/VaultService.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";

contract EthVaultService is VaultService, Upgradeable {

    address private immutable ETH_TOKEN = address(1);

    function EthVaultService_init(
        string memory _name
    ) public initializer {
        __VaultService_init(ETH_TOKEN,_name);
    }

    function _authorizeUpgrade(address) internal virtual view override {
        require(msg.sender == owner());
    }

    function transfer(uint256 amount) external virtual onlyOwner returns (bool) {
        (bool sent,) = owner().call{value: amount}("");
        require(sent, "ETH approval Failed");
        return true;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}