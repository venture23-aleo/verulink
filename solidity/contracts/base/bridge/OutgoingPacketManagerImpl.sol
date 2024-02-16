// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";

abstract contract OutgoingPacketManagerImpl {
    using PacketLibrary for PacketLibrary.OutPacket;

    event PacketDispatched(PacketLibrary.OutPacket packet);
    
    uint256 public sequence;
    //sequence => Packet hash
    mapping(uint256 => bytes32) public outgoingPackets;

    function _sendMessage(PacketLibrary.OutPacket memory packet) public virtual {
        packet.version = 1;
        packet.sequence = ++sequence;
        outgoingPackets[packet.sequence] = packet.hash();
        emit PacketDispatched(packet);
    }  

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;  
}
