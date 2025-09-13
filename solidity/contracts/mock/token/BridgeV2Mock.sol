// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Bridge} from "../../main/Bridge.sol";
// import {Ownable} from "../../common/Ownable.sol";

contract BridgeV2Mock is Bridge {
    uint256 public val;

    /// @custom:oz-upgrades-validate-as-initializer
    function initializev2(uint256 val1) public reinitializer(2) {
        val = val1;
    }
}
