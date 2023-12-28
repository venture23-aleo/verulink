// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IncomingPacketManager} from "./IncomingPacketManager.sol";
import "../../common/libraries/Lib.sol";

contract ConsumedPacketManagerImpl is IncomingPacketManager {
    using PacketLibrary for PacketLibrary.InPacket;

    event Consumed(uint256 chainId, uint256 sequence, bytes32 packetHash);
    
    mapping(uint256 => mapping(uint256 => bytes32)) public consumedPackets;

    function _preValidateConsumePacket(PacketLibrary.InPacket memory packet) internal view {
        require(!isPacketConsumed(packet.sourceTokenService.chainId, packet.sequence), "Packet already consumed");
    }

    function isPacketConsumed(uint256 _chainId, uint256 _sequence) public view virtual override returns (bool) {
        return consumedPackets[_chainId][_sequence] != bytes32(0);
    }

    function _updateConsumePacketState(PacketLibrary.InPacket memory packet) internal virtual {
        _removeIncomingPacket(packet.sourceTokenService.chainId, packet.sequence);
        consumedPackets[packet.sourceTokenService.chainId][packet.sequence] = packet.hash();
    }

    function consume(PacketLibrary.InPacket memory packet) public virtual {
        bytes32 packetHash = getIncomingPacketHash(packet.sourceTokenService.chainId, packet.sequence);
        require(packet.hash() == packetHash, "Unknown Packet Hash");
        _preValidateConsumePacket(packet);
        _updateConsumePacketState(packet);
        emit Consumed(packet.sourceTokenService.chainId, packet.sequence, packetHash);
    }
}