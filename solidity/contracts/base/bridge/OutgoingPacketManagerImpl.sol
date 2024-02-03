// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";

abstract contract OutgoingPacketManagerImpl  {
    using PacketLibrary for PacketLibrary.OutPacket;

    event PacketDispatched(PacketLibrary.OutPacket packet);
    
    //sequence => Packet hash
    mapping(uint256 => bytes32) public outgoingPackets;

    uint256 public sequence;

    function sendMessage(PacketLibrary.OutPacket memory packet) public virtual {
        packet.version = 1;
        packet.sequence = ++sequence;
        outgoingPackets[packet.sequence] = packet.hash();
        emit PacketDispatched(packet);
    }    
}
