// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";
import {OutgoingPacketManagerImpl} from "./OutgoingPacketManagerImpl.sol";

/// @title OutgoingPacketManagerImpl
/// @dev Abstract contract for managing outgoing packets on a bridge
abstract contract OutgoingPacketManagerImplV2 is OutgoingPacketManagerImpl {
    using PacketLibrary for PacketLibrary.OutPacket;

    /// @notice Emitted when a packet is dispatched
    /// @param packet The OutPacket struct containing the outgoing packet information
    event PacketDispatched(PacketLibrary.OutPacket packet, bytes data);

    /// @dev Sends an outgoing packet by updating its version, assigning a sequence number, storing its hash, and emitting a PacketDispatched event
    /// @param packet The OutPacket struct containing the outgoing packet information
    function _sendMessage(PacketLibrary.OutPacket memory packet, bytes calldata data) internal virtual {
        packet.sequence = ++sequence;
        outgoingPackets[packet.sequence] = packet.hash();
        emit PacketDispatched(packet, data);
    }  

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;  
}
