// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {TokenService} from "../../main/tokenservice/TokenService.sol";

contract TokenServiceV2 is TokenService {
    uint256 public val;

    function initializev2(uint256 val1) public reinitializer(2) {
        val = val1;
    }
}
