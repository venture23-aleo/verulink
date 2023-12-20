// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IncomingPacketManager} from "./IncomingPacketManager.sol";
import "../../common/libraries/Lib.sol";

contract ConsumedPacketManagerImpl is IncomingPacketManager {

    event Consumed(bytes32 packetHash);
    
    mapping(uint256 => mapping(uint256 => bytes32)) public consumedPackets;

    function _preValidateConsumePacket(PacketLibrary.InPacket memory packet) internal view {
        require(!isPacketConsumed(packet.destTokenService.chainId, packet.sequence), "Packet already consumed");
    }

    function isPacketConsumed(uint256 _chainId, uint256 _sequence) public view returns (bool) {
        return consumedPackets[_chainId][_sequence] != bytes32(0);
    }

    function _updateConsumePacketState(PacketLibrary.InPacket memory packet) internal virtual {
        if(!incomingPacketExists(packet.destTokenService.chainId, packet.sequence)) return; // 2 to represent consume operation, 1 to receive packet operation
        _removeIncomingPacket(packet.destTokenService.chainId, packet.sequence);
        consumedPackets[packet.destTokenService.chainId][packet.sequence] = _hash(packet);
    }

    function consume(PacketLibrary.InPacket memory packet) public virtual {
        bytes32 packetHash = getIncomingPacketHash(packet.destTokenService.chainId, packet.sequence);
        require(packetHash == _hash(packet), "Unknown Packet");
        _preValidateConsumePacket(packet);
        _updateConsumePacketState(packet);
        emit Consumed(packetHash);
    }
}