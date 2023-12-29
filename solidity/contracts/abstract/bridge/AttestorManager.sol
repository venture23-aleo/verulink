// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../common/Ownable.sol";

contract AttestorManager is Ownable{
    event AttestorAdded(address attestor, uint256 destChainId, uint256 quorum);
    event AttestorRemoved(address attestor, uint256 destChainId, uint256 quorum);

    mapping(address => mapping(uint256 => bool)) private attestors;
    mapping(uint256 => uint256) quorumRequired;

    function isAttestor(address attestor, uint256 destChainId) public view returns (bool) {
        return attestors[attestor][destChainId];
    }

    function addAttestor(address attestor, uint256 destChainId, uint256 newQuorumRequired) public onlyOwner {
        require(attestor != address(0), "Zero Address");
        require(!attestors[attestor][destChainId], "Attestor already exists");
        attestors[attestor][destChainId] = true;
        quorumRequired[destChainId] = newQuorumRequired;
        emit AttestorAdded(attestor, destChainId, newQuorumRequired);
    }

    function removeAttestor(address attestor, uint256 destChainId, uint256 newQuorumRequired) public onlyOwner {
        require(attestors[attestor][destChainId], "Unknown Attestor");
        delete attestors[attestor][destChainId];
        quorumRequired[destChainId] = newQuorumRequired;
        emit AttestorRemoved(attestor, destChainId, newQuorumRequired);
    }

    // setter for quorum required
}