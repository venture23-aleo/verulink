// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Holding} from "../../main/Holding.sol";
// import {Ownable} from "../../common/Ownable.sol";

contract HoldingMock is Holding {
    function transferETH (address to, uint256 amount) external {
        (bool sent,) = to.call{value: amount}("");
        require(sent, "ETH Release Failed");
    }
}
