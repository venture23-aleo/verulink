// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Pausable} from "../../common/Pausable.sol";
import {IERC20} from "../../common/interface/tokenservice/IERC20.sol";

abstract contract HiYieldAdapter is Pausable {
    address _usdc_;

    function initialize(address _owner, address _usdc) public {
        super.initialize(_owner);
        _usdc_ = _usdc;
    }

    function approve(uint256 amount) external onlyOwner onlyProxy {
        require(IERC20(_usdc_).approve(_owner_, amount));
    }
}