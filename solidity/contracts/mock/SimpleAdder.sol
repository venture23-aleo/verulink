// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleAdder {
    // Declare state variables
    uint256 public number1;
    uint256 public number2;

    // Constructor to initialize the numbers
    constructor(uint256 _number1, uint256 _number2) {
        number1 = _number1;
        number2 = _number2;
    }

    // Function to add two numbers and return the result
    function add() public view returns (uint256) {
        return number1 + number2;
    }

    // Optionally, you can include a function to set new numbers
    function setNumbers(uint256 _number1, uint256 _number2) public {
        number1 = _number1;
        number2 = _number2;
    }
}
