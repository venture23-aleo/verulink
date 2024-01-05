// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../common/Ownable.sol";

contract AttestorManager is Ownable{
    event AttestorAdded(address attestor, uint256 quorum);
    event AttestorRemoved(address attestor, uint256 quorum);

    mapping(address => bool) private attestors;
    uint256 public quorumRequired;

    function isAttestor(address attestor) public view returns (bool) {
        return attestors[attestor];
    }

    function addAttestor(address attestor, uint256 newQuorumRequired) public onlyOwner {
        require(attestor != address(0), "Zero Address");
        require(!isAttestor(attestor), "Attestor already exists");
        attestors[attestor] = true;
        quorumRequired = newQuorumRequired;
        emit AttestorAdded(attestor, newQuorumRequired);
    }

    function removeAttestor(address attestor, uint256 newQuorumRequired) public onlyOwner {
        require(attestors[attestor], "Unknown Attestor");
        delete attestors[attestor];
        quorumRequired = newQuorumRequired;
        emit AttestorRemoved(attestor, newQuorumRequired);
    }

    function addAttestors(address[] memory _attestors, uint256 newQuorumRequired) public onlyOwner {
        for(uint256 i=0;i<_attestors.length;i++) {
            addAttestor(_attestors[i], newQuorumRequired);
        }
    }

    // setter for quorum required
}