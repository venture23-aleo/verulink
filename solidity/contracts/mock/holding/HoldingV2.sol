// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Holding} from "../../main/Holding.sol";
// import {Ownable} from "../../common/Ownable.sol";

contract HoldingV2 is Holding {
    uint256 public val;

    /// @custom:oz-upgrades-validate-as-initializer
    function initializev2(uint256 val1) public reinitializer(2) {
        val = val1;
    }
}
