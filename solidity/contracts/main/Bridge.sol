// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {AleoAddressLibrary} from "../common/libraries/AleoAddressLibrary.sol";
import {PacketLibrary} from "../common/libraries/PacketLibrary.sol";
import {Pausable} from "../common/Pausable.sol";
import {AttestorManager} from "../base/bridge/AttestorManager.sol";
import {BridgeTokenServiceManager} from "../base/bridge/BridgeTokenServiceManager.sol";
import {ConsumedPacketManagerImpl} from "../base/bridge/ConsumedPacketManagerImpl.sol";
import {OutgoingPacketManagerImpl} from "../base/bridge/OutgoingPacketManagerImpl.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";


/// @title Bridge Contract
/// @dev This contract implements OwnableUpgradeable, Pausable, AttestorManager, BridgeTokenServiceManager, ConsumedPacketManagerImpl, OutgoingPacketManagerImpl, and Upgradeable contracts.
contract Bridge is 
    OwnableUpgradeable,
    Pausable,
    AttestorManager,
    BridgeTokenServiceManager,
    ConsumedPacketManagerImpl,
    OutgoingPacketManagerImpl,
    Upgradeable
{
    using PacketLibrary for PacketLibrary.InPacket;
    
    /// @notice Event triggered when the destination chain is updated
    /// @param oldDestinationChainId The old destination chain ID
    /// @param newDestinationChainId The new destination chain ID
    event ChainUpdated(uint256 oldDestinationChainId, uint256 newDestinationChainId);

    /// @notice The destination chain ID for packet routing
    uint256 public destinationChainId;

    /// @dev Initializes the Bridge contract
    /// @param _destChainId The initial destination chain ID
    function Bridge_init(
        uint256 _destChainId,
        address _owner
    ) public initializer {
        __Ownable_init_unchained(_owner);
        __Pausable_init_unchained();
        destinationChainId = _destChainId;
        _transferOwnership(_owner);      
    }

    function _authorizeUpgrade(address) internal virtual view override {
        require(msg.sender == owner());
    }

    /// @notice Checks if a given destination chain is supported
    /// @param destChainId The destination chain ID to check
    /// @return true if supported, false otherwise
    function isSupportedChain(uint256 destChainId) public view returns (bool) {
        return destinationChainId == destChainId;
    }

    /// @notice Updates the destination chain ID, callable only by the owner
    /// @param newDestChainId The new destination chain ID
    function updateDestinationChainId(uint256 newDestChainId) external onlyOwner {
        require(!isSupportedChain(newDestChainId), "Bridge: destination chain already supported");
        emit ChainUpdated(destinationChainId, newDestChainId);
        destinationChainId = newDestChainId;
    }

    /// @dev Validates if the attestation signer is an authorized attestor
    /// @param signer The address of the attestation signer
    /// @return true if the signer is a valid attestor, false otherwise
    function _validateAttestor(address signer) internal view override returns (bool) {
        return isAttestor(signer);
    }

    /// @notice Consumes a packet with provided signatures
    /// @param packet The input packet to be consumed
    /// @param signatures The array of signatures for attestation
    /// @return Votes result of the packet consumption
    function consume(
        PacketLibrary.InPacket memory packet, 
        bytes memory signatures
    ) external whenNotPaused returns (PacketLibrary.Vote)
    {
        require(isRegisteredTokenService(msg.sender), "Bridge: unknown token service");
        return _consume(packet.hash(), packet.sourceTokenService.chainId, packet.sequence, signatures, quorumRequired);
    }

    function validateAleoAddress(string memory addr) public pure returns (bool) {
        return AleoAddressLibrary.validateAleoAddr(addr);
    }

    /// @notice Sends a message packet to the specified destination chain
    /// @param packet The outgoing packet to be sent
    function sendMessage(PacketLibrary.OutPacket memory packet) public virtual whenNotPaused {
        require(isSupportedChain(packet.destTokenService.chainId), "Bridge: unknown destination chain");
        require(isRegisteredTokenService(msg.sender), "Bridge: unknown token service");
        _sendMessage(packet);
    } 

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}