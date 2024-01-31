// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Pausable} from "../../common/Pausable.sol";
import "@thirdweb-dev/contracts/extension/Initializable.sol";

contract PausableMock is Pausable, Initializable {
    function initialize(address _owner) public initializer {
        _initialize(_owner);
    }
}
