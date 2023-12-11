// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../Common/Ownable.sol";

abstract contract AttestorManager is Ownable{
    event AttestorAdded(address attestor, uint256 quorum);
    event AttestorRemoved(address attestor, uint256 quorum);

    mapping(address => bool) private attestors;
    uint256 quorumRequired;

    function isAttestor(address attestor) public view returns (bool) {
        return attestors[attestor];
    }

    function addAttestor(address attestor, uint256 newQuorumRequired) public onlyOwner {
        require(attestor != address(0), "Zero Address");
        attestors[attestor] = true;
        quorumRequired = newQuorumRequired;
        emit AttestorAdded(attestor, newQuorumRequired);
    }

    function removeAttestor(address attestor, uint256 newQuorumRequired) public onlyOwner {
        if(isAttestor(attestor)) {
            delete attestors[attestor];
            quorumRequired = newQuorumRequired;
            emit AttestorRemoved(attestor, newQuorumRequired);
        }
    }
}