// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../Common/Ownable.sol";

abstract contract BlackListService is Ownable {
    event BlackListAdded(address addr);
    event BlackListRemoved(address addr);

    mapping(address => bool) blackLists;

    function addToBlackList(address addr) external onlyOwner {
        emit BlackListAdded(addr);
        blackLists[addr] = true;
    }
    function removeFromBlackList(address addr) external onlyOwner {
        emit BlackListRemoved(addr);
        delete blackLists[addr];
    }
    function isBlackListed(address addr) public view returns (bool) {
        return blackLists[addr];
    }
}