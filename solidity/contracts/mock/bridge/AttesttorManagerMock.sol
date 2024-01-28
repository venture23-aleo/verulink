// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {AttestorManager} from "../../base/bridge/AttestorManager.sol";

contract AttestorManagerMock is AttestorManager {
    function initializemock(address _owner) public {
        _initialize(_owner);
    }
}
