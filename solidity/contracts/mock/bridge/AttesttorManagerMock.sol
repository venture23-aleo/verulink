// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {AttestorManager} from "../../base/bridge/AttestorManager.sol";

contract AttestorManagerMock is AttestorManager {
    function AttestorManager_init() public initializer {
        __AttestorManager_init();
    }
}
