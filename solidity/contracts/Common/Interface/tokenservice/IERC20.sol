// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external;
    function transfer(address recipient, uint256 amount) external;
}