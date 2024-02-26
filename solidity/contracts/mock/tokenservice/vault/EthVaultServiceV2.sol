// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {EthVaultService} from "../../../main/tokenservice/vault/EthVaultService.sol";

contract EthVaultServiceV2 is EthVaultService {
    uint256 public val;

    function initializev2(uint256 val1) public reinitializer(2) {
        val = val1;
    }
}
