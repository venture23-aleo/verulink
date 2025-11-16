// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title AttestorManagerV2
/// @notice Manages authorized attestors and quorum configuration for cross-chain attestations
/// @dev Upgrade-safe, extensible version for bridge governance
abstract contract AttestorManagerV2 is OwnableUpgradeable {
    /// @dev Event emitted when a new attestor is added
    event AttestorAdded(address indexed attestor);

    /// @dev Event emitted when an attestor is removed
    event AttestorRemoved(address indexed attestor);

    /// @dev Event emitted when quorum requirement is updated
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);

    /// @dev Event emitted when maximum attestor count is updated
    event MaxAttestorCountUpdated(uint8 oldMaxCount, uint8 newMaxCount);

    /// @dev Mapping of authorized attestors
    mapping(address => bool) private attestors;

    /// @notice The quorum of valid attestor votes required for an action
    uint256 public quorumRequired;

    /// @notice The number of currently registered attestors
    uint8 public attestorCount;

    /// @notice The maximum number of attestors that can be registered
    uint8 public maxAttestorCount;

    // --------------------------------------------------------------
    // 🔹 Core Management
    // --------------------------------------------------------------

    /// @notice Returns true if an address is a registered attestor
    function isAttestor(address attestor) public view virtual returns (bool) {
        return attestors[attestor];
    }

    /// @notice Adds a new attestor and updates quorum requirement, callable only by the owner
    /// @param attestor The address to add
    /// @param newQuorumRequired The new quorum after adding
    function addAttestor(address attestor, uint256 newQuorumRequired) public virtual onlyOwner {
        _addAttestor(attestor);
        _updateQuorumInternal(newQuorumRequired);
    }

    /// @dev Internal function to add a single attestor
    function _addAttestor(address attestor) internal virtual {
        require(attestor != address(0), "AttestorManager: zeroAddress");
        require(!isAttestor(attestor), "AttestorManager: attestorExists");
        require(attestorCount < maxAttestorCount, "AttestorManager: maxAttestorCountReached");

        attestors[attestor] = true;
        attestorCount++;

        emit AttestorAdded(attestor);
    }

    /// @notice Adds multiple attestors and updates quorum requirement, callable only by the owner
    function addAttestors(address[] calldata _attestors, uint256 newQuorumRequired) external virtual onlyOwner {
        for (uint256 i = 0; i < _attestors.length; i++) {
            _addAttestor(_attestors[i]);
        }
        _updateQuorumInternal(newQuorumRequired);
    }

    /// @notice Removes an existing attestor and updates quorum, callable only by the owner
    function removeAttestor(address attestor, uint256 newQuorumRequired) external virtual onlyOwner {
        require(isAttestor(attestor), "AttestorManager: unknownAttestor");
        delete attestors[attestor];
        attestorCount--;

        emit AttestorRemoved(attestor);
        _updateQuorumInternal(newQuorumRequired);
    }

    // --------------------------------------------------------------
    // 🔹 Quorum & Limits
    // --------------------------------------------------------------

    /// @notice Updates the quorum requirement, callable only by the owner
    /// @param newQuorumRequired The new quorum requirement
    function updateQuorum(uint256 newQuorumRequired) external virtual onlyOwner {
        _updateQuorumInternal(newQuorumRequired);
    }

         /// @dev Internal quorum update logic
    function _updateQuorumInternal(uint256 newQuorumRequired) internal {
        require(newQuorumRequired > 0, "AttestorManager: zeroQuorum");
        require(newQuorumRequired <= attestorCount, "AttestorManager: quorumExceedsAttestors");

        emit QuorumUpdated(quorumRequired, newQuorumRequired);
        quorumRequired = newQuorumRequired;
    }


    /// @notice Updates the maximum number of attestors allowed, callable only by the owner
    /// @param newMaxAttestorCount The new maximum number of attestors allowed
    function updateMaxAttestorCount(uint8 newMaxAttestorCount) public virtual onlyOwner {
        require(newMaxAttestorCount > 0, "AttestorManager: CountZero");
        emit MaxAttestorCountUpdated(maxAttestorCount, newMaxAttestorCount);
        maxAttestorCount = newMaxAttestorCount;
    }

    /// @notice Forcefully sets current attestor count (e.g., during migration)
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
