// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import Ownable from OpenZeppelin
import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiplicationContract is Ownable {
    constructor(address newOwner) {
        require(newOwner != address(0), "New owner cannot be zero address");
        _transferOwnership(newOwner);
    }

    function multiply(uint256 a, uint256 b) public pure returns (uint256) {
        uint256 result = a * b;
        return result;
    }

    function square(uint256 a) public pure returns (uint256) {
        uint256 result = a * a;
        return result;
    }
}
