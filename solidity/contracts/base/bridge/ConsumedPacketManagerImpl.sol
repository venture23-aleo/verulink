// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IncomingPacketManager} from "./IncomingPacketManager.sol";
import "../../common/libraries/Lib.sol";

abstract contract ConsumedPacketManagerImpl is IncomingPacketManager {
    using PacketLibrary for PacketLibrary.InPacket;

    event Consumed(uint256 chainId, uint256 sequence, bytes32 packetHash);

    mapping(uint256 => mapping(uint256 => bytes32)) public consumedPackets;

    function isPacketConsumed(
        uint256 _chainId,
        uint256 _sequence
    ) public view virtual override returns (bool) {
        return consumedPackets[_chainId][_sequence] != bytes32(0);
    }

    function consume(PacketLibrary.InPacket memory packet) public virtual {
        bytes32 packetHash = packet.hash();
        uint256 sourceChainId = packet.sourceTokenService.chainId;
        uint256 sequence = packet.sequence;
        require(
            !isPacketConsumed(
                sourceChainId,
                sequence
            ),
            "Packet already consumed"
        );
        require(
            packetHash ==
                getIncomingPacketHash(
                    sourceChainId,
                    sequence
                ),
            "Unknown Packet Hash"
        );

       _removeIncomingPacket(
            sourceChainId,
            sequence
        );

        consumedPackets[sourceChainId][
            sequence
        ] = packetHash;

        emit Consumed(
            sourceChainId,
            sequence,
            packetHash
        );
    }
}
