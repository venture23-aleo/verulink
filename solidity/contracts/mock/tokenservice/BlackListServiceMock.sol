// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {BlackListService} from "../../main/tokenservice/BlackListService.sol";

contract BlackListServiceMock is BlackListService {
    function initializemock(address _owner, address _usdc, address _usdt) public {
        initialize(_owner, _usdc, _usdt);
    }
}
