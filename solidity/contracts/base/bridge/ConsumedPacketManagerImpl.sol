// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IncomingPacketManager} from "./IncomingPacketManager.sol";
import "../../common/libraries/Lib.sol";

abstract contract ConsumedPacketManagerImpl is IncomingPacketManager {
    using PacketLibrary for PacketLibrary.InPacket;

    event Consumed(uint256 chainId, uint256 sequence, bytes32 packetHash);

    mapping(uint256 => mapping(uint256 => bytes32)) public consumedPackets;

    function _preValidateConsumePacket(
        PacketLibrary.InPacket memory packet,
        bytes32 packetHash
    ) internal view {
        require(
            !isPacketConsumed(
                packet.sourceTokenService.chainId,
                packet.sequence
            ),
            "Packet already consumed"
        );
        require(
            packetHash ==
                getIncomingPacketHash(
                    packet.sourceTokenService.chainId,
                    packet.sequence
                ),
            "Unknown Packet Hash"
        );
    }

    function isPacketConsumed(
        uint256 _chainId,
        uint256 _sequence
    ) public view virtual override returns (bool) {
        return consumedPackets[_chainId][_sequence] != bytes32(0);
    }

    function _updateConsumePacketState(
        PacketLibrary.InPacket memory packet,
        bytes32 packetHash
    ) internal virtual {
        _removeIncomingPacket(
            packet.sourceTokenService.chainId,
            packet.sequence
        );
        consumedPackets[packet.sourceTokenService.chainId][
            packet.sequence
        ] = packetHash;
    }

    function consume(PacketLibrary.InPacket memory packet) public virtual {
        bytes32 packetHash = packet.hash();
        _preValidateConsumePacket(packet, packetHash);
        _updateConsumePacketState(packet, packetHash);
        emit Consumed(
            packet.sourceTokenService.chainId,
            packet.sequence,
            packetHash
        );
    }
}
