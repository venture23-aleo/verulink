// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {BlackListService} from "../../main/tokenservice/BlackListService.sol";
import {Ownable} from "../../common/Ownable.sol";

contract BlackListServiceV2 is BlackListService {
    uint256 public val;

    function initializev2(uint256 val1) public reinitializer(2) {
        val = val1;
    }
}
