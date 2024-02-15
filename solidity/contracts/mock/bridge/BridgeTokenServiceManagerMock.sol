// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {BridgeTokenServiceManager} from "../../base/bridge/BridgeTokenServiceManager.sol";

contract BridgeTokenServiceManagerMock is BridgeTokenServiceManager {
    function BridgeTokenServiceManager_init() public initializer {
        __BridgeTokenServiceManager_init();
    }
}
