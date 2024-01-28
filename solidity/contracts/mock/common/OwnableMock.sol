// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../common/Ownable.sol";

contract OwnableMock is Ownable {
    function initializemock(address _owner) public {
        _initialize(_owner);
    }
}
