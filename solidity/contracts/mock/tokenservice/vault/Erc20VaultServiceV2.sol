// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Erc20VaultService} from "../../../main/tokenservice/vault/Erc20VaultService.sol";

contract Erc20VaultServiceV2 is Erc20VaultService {
    uint256 public val;

    function initializev2(uint256 val1) public reinitializer(2) {
        val = val1;
    }
}
