// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract AttestorManager is OwnableUpgradeable {
    event AttestorAdded(address attestor, uint256 quorum);
    event AttestorRemoved(address attestor, uint256 quorum);
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);

    mapping(address => bool) private attestors;
    uint256 public quorumRequired;

    function AttestorManager_init() public initializer {
        __Ownable_init_unchained();
    }

    function isAttestor(address attestor) public virtual view returns (bool) {
        return attestors[attestor];
    }

    function addAttestor(address attestor, uint256 newQuorumRequired) public virtual onlyOwner {
        require(attestor != address(0), "Zero Address");
        require(!isAttestor(attestor), "Attestor already exists");
        attestors[attestor] = true;
        quorumRequired = newQuorumRequired;
        emit AttestorAdded(attestor, newQuorumRequired);
    }

    function removeAttestor(address attestor, uint256 newQuorumRequired) external virtual onlyOwner {
        require(attestors[attestor], "Unknown Attestor");
        delete attestors[attestor];
        quorumRequired = newQuorumRequired;
        emit AttestorRemoved(attestor, newQuorumRequired);
    }

    function addAttestors(address[] calldata _attestors, uint256 newQuorumRequired) external virtual onlyOwner {
        for(uint256 i=0;i<_attestors.length;i++) {
            addAttestor(_attestors[i], newQuorumRequired);
        }
    }

    function updateQuorum(uint256 newQuorumRequired) external virtual onlyOwner {
        emit QuorumUpdated(quorumRequired, newQuorumRequired);
        quorumRequired = newQuorumRequired;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}