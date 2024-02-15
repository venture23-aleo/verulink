// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Pausable} from "../../common/Pausable.sol";

contract PausableMock is Pausable {
    function initialize(address _owner) public initializer {
        __Pausable_init();
    }
}
