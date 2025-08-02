// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title AttestorManager Contract
/// @dev This contract manages a list of attestors and their quorum requirements.
abstract contract AttestorManagerV2 is OwnableUpgradeable {

    /// @dev Event triggered when a new attestor is added
    /// @param attestor The address of the new attestor
    event AttestorAdded(address indexed attestor);

    /// @dev Event triggered when an attestor is removed
    /// @param attestor The address of the removed attestor
    event AttestorRemoved(address indexed attestor);

    /// @dev Event triggered when the quorum requirement is updated
    /// @param oldQuorum The previous quorum requirement
    /// @param newQuorum The new quorum requirement
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);

    /// @dev Mapping to track whether an address is an attestor
    mapping(address => bool) private attestors;

    /// @dev The quorum required for attestations
    uint256 public quorumRequired;

    /// @dev The number of attestors
    uint8 public attestorCount;

    /// @dev The maximum number of attestors allowed
    uint8 public maxAttestorCount;

    /// @notice Checks if an address is a registered attestor, callable only by the owner
    /// @param attestor The address to check
    /// @return true if the address is an attestor, false otherwise
    function isAttestor(address attestor) public virtual view returns (bool) {
        return attestors[attestor];
    }

    /// @notice Adds a new attestor, callable only by the owner
    /// @param attestor The address of the new attestor
    /// @param newQuorumRequired The quorum required for the new attestor
    function addAttestor(address attestor, uint256 newQuorumRequired) public virtual onlyOwner {
        _addAttestor(attestor);
        updateQuorum(newQuorumRequired);
    }

    /// @notice Adds a new attestor, internal function
    /// @param attestor The address of the new attestor
    function _addAttestor(address attestor) internal virtual {
        require(attestorCount < maxAttestorCount, "AttestorManager: maxAttestorCountReached");
        require(attestor != address(0), "AttestorManager: zero address");
        require(!isAttestor(attestor), "AttestorManager: attestor already exists");
        attestors[attestor] = true;
        attestorCount++;
        emit AttestorAdded(attestor);
    }

    /// @notice Removes an attestor, callable only by the owner
    /// @param attestor The address of the attestor to be removed
    /// @param newQuorumRequired The new quorum requirement after removal
    function removeAttestor(address attestor, uint256 newQuorumRequired) external virtual onlyOwner {
        require(attestors[attestor], "AttestorManager: unknown attestor");
        delete attestors[attestor];
        attestorCount--;
        emit AttestorRemoved(attestor);
        updateQuorum(newQuorumRequired);
    }

    /// @notice Adds multiple attestors, callable only by the owner
    /// @param _attestors The addresses of the new attestors
    /// @param newQuorumRequired The quorum required for the new attestors
    function addAttestors(address[] calldata _attestors, uint256 newQuorumRequired) external virtual onlyOwner {
        for(uint256 i=0; i<_attestors.length; i++) {
            _addAttestor(_attestors[i]);
        }
        updateQuorum(newQuorumRequired);
    }

    /// @notice Updates the quorum requirement, callable only by the owner
    /// @param newQuorumRequired The new quorum requirement
    function updateQuorum(uint256 newQuorumRequired) public virtual onlyOwner {
        require(newQuorumRequired > 0, "AttestorManager: zero quorum");
        emit QuorumUpdated(quorumRequired, newQuorumRequired);
        quorumRequired = newQuorumRequired;
    }

    /// @notice Updates the maximum number of attestors allowed, callable only by the owner
    /// @param newMaxAttestorCount The new maximum number of attestors allowed
    function updateMaxAttestorCount(uint8 newMaxAttestorCount) public virtual onlyOwner {
        require(newMaxAttestorCount > 0, "AttestorManager: zero maxAttestorCount");
        maxAttestorCount = newMaxAttestorCount;
    }

    function setAttestorCount(uint8 _attestorCount) public virtual onlyOwner {
        attestorCount = _attestorCount;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[48] private __gap;
}