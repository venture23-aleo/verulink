// ERC20TokenSupport
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {TokenSupport} from "../../base/tokenservice/TokenSupport.sol";

contract ERC20TokenSupportMock is TokenSupport {
    function TokenSupport_init(uint256 destChainId) public initializer {
        __TokenSupport_init(destChainId);
    }
}
