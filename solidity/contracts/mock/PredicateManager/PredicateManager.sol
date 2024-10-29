// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

contract PredicateManager {
    // Mapping to hold the policies for each address
    mapping(address => string) private policies;

    function setPolicy(string memory policyID) external {
        policies[msg.sender] = policyID;
    }
}
