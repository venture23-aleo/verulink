// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Holding} from "../../HoldingContract.sol";
import {Ownable} from "../../common/Ownable.sol";

contract HoldingV2 is Holding {
    uint256 public val;

    function initializev2(uint256 val1) public reinitializer(2) {
        val = val1;
    }
}
