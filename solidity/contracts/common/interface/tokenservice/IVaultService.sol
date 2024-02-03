// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

interface IVaultService {
    function token() external view returns (address);
    function name() external view returns (string memory);
    function transfer(uint256 amount) external returns (bool);
}