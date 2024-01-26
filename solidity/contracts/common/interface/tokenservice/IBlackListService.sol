// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

interface IBlackListService {
    function isBlackListed(address account) external view returns (bool);
}