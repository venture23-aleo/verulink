// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {BridgeTokenServiceManager} from "../../base/bridge/BridgeTokenServiceManager.sol";

contract BridgeTokenServiceManagerMock is BridgeTokenServiceManager {
    function initializemock(address _owner) public {
        _initialize(_owner);
    }
}
