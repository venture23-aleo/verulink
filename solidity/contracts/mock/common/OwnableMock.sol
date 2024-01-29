// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../common/Ownable.sol";
import "@thirdweb-dev/contracts/extension/Initializable.sol";

contract OwnableMock is Ownable, Initializable {
    function initialize(address _owner) public initializer {
        _initialize(_owner);
    }
}
