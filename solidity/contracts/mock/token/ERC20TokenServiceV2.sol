// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {ERC20TokenService} from "../../main/tokenservice/ERC20TokenService.sol";
import {Ownable} from "../../common/Ownable.sol";

contract ERC20TokenServiceV2 is ERC20TokenService {
    uint256 public val;

    function initializev2(uint256 val1) public reinitializer(2) {
        val = val1;
    }
}
