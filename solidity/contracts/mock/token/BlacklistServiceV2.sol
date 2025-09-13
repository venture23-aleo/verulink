// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {BlackListService} from "../../main/tokenservice/BlackListService.sol";

contract BlackListServiceV2 is BlackListService {
    uint256 public val;

    /// @custom:oz-upgrades-validate-as-initializer
    function initializev2(uint256 val1) public reinitializer(2) {
        val = val1;
    }
}
