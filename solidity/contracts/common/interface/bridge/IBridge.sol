// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {PacketLibrary} from  "../../libraries/PacketLibrary.sol";

/// @title IBridge
/// @dev Interface for the Bridge contract
interface IBridge {

    /// @notice Emitted when a packet is dispatched from the Bridge
    /// @param packet The dispatched packet
    event PacketDispatched(PacketLibrary.OutPacket packet);

    /// @notice Emitted when a packet arrives at the Bridge
    /// @param packet The arrived packet
    event PacketArrived(PacketLibrary.InPacket packet);

    function isAttestor(address signer) external view returns (bool);
    function sendMessage(PacketLibrary.OutPacket memory packet) external;

     /// @notice Consumes an incoming packet and validates the provided signatures
    /// @param packet The incoming packet to be consumed
    /// @param signatures The array of signatures to be validated
    /// @return The overall vote (YEA, NAY, or NULL) based on the provided signatures
    function consume(PacketLibrary.InPacket memory packet, bytes memory signatures) external returns (PacketLibrary.Vote);
    function validateAleoAddress(string memory addr) external pure returns (bool);
}