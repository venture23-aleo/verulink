// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

interface ITokenService {
    function transfer(address tokenAddress, uint256 amount, string calldata receiver, bool isRelayerOn, bytes calldata data) external;
}