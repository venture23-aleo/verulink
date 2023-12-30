// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {ERC20TokenBridge} from "../../ERC20TokenBridge.sol";
import {Ownable} from "../../common/Ownable.sol";

contract ERC20TokenBridgeV2 is ERC20TokenBridge {
    uint256 public val;

    function initializev2(uint256 val1) public reinitializer(2) {
        val = val1;
    }
}
