// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "../../common/libraries/Lib.sol";

contract OutgoingPacketManagerImpl  {
    
    event PacketDispatched(PacketLibrary.OutPacket packet);
    
    // chainId => sequence => Packet
    mapping(uint256 => mapping(uint256 => PacketLibrary.OutPacket)) public outgoingPackets;
    // chainId => sequence number
    mapping(uint256 => uint256) public sequences;

    function _incrementSequence(uint256 _chainId) internal returns (uint256) {
        sequences[_chainId] += 1;
        return sequences[_chainId];
    }

    function sendMessage(PacketLibrary.OutPacket memory packet) public virtual {
        packet.version = 1;
        packet.sequence = _incrementSequence(packet.destTokenService.chainId);

        outgoingPackets[packet.destTokenService.chainId][packet.sequence] = packet;
        emit PacketDispatched(packet);
    }    
}
