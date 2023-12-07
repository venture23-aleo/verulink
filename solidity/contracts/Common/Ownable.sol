// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

contract Ownable {
    address public owner;
    modifier onlyOwner {
        require(msg.sender == owner, "Not owner");
        _;
    }
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}