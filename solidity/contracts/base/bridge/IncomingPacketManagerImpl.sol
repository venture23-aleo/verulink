// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import {IncomingPacketManager} from "./IncomingPacketManager.sol";
import "../../common/libraries/Lib.sol";

abstract contract IncomingPacketManagerImpl is IncomingPacketManager {
    using PacketLibrary for PacketLibrary.InPacket;

    event PacketArrived(PacketLibrary.InPacket packet);
    event Voted(bytes32 packetHash, address voter);
    event AlreadyVoted(bytes32 packetHash, address voter);

    mapping(uint256 => mapping(uint256 => bytes32)) public incomingPackets;

    // packetHash => vote count
    mapping(bytes32 => uint256) votes;
    // packetHash => attestor address => bool
    mapping(bytes32 => mapping(address => bool)) voted;

    function _removeIncomingPacket(
        uint256 _chainId,
        uint256 _sequence
    ) internal virtual override {
        delete incomingPackets[_chainId][_sequence];
    }

    function getIncomingPacketHash(
        uint256 _chainId,
        uint256 _sequence
    ) public view virtual override returns (bytes32 packetHash) {
        return incomingPackets[_chainId][_sequence];
    }

    function _receivePacket(PacketLibrary.InPacket memory packet) internal {
        _preValidateInPacket(packet);
        _updateInPacketState(packet);
    }

    function _preValidateInPacket(
        PacketLibrary.InPacket memory packet
    ) internal view {
        require(
            !isPacketConsumed(
                packet.sourceTokenService.chainId,
                packet.sequence
            ),
            "Packet already consumed"
        );
    }

    function _updateInPacketState(
        PacketLibrary.InPacket memory packet
    ) internal {
        bytes32 packetHash = packet.hash();
        if (hasVoted(packetHash, msg.sender)) {
            emit AlreadyVoted(packetHash, msg.sender);
            return;
        }

        emit Voted(packetHash, msg.sender);

        voted[packetHash][msg.sender] = true;
        votes[packetHash] += 1;

        if (!hasQuorumReached(packetHash, packet.sourceTokenService.chainId))
            return;

        incomingPackets[packet.sourceTokenService.chainId][
            packet.sequence
        ] = packetHash;
        emit PacketArrived(packet);
    }

    function hasQuorumReached(
        bytes32 packetHash,
        uint256 chainId
    ) public view returns (bool) {
        return votes[packetHash] >= _getQuorumRequired(chainId);
    }

    function hasQuorumReached(
        uint256 chainId,
        uint256 sequence
    ) public view returns (bool) {
        return
            hasQuorumReached(getIncomingPacketHash(chainId, sequence), chainId);
    }

    function hasVoted(
        bytes32 packetHash,
        address voter
    ) public view returns (bool) {
        return voted[packetHash][voter];
    }

    function hasVoted(
        uint256 chainId,
        uint256 sequence,
        address voter
    ) public view returns (bool) {
        return voted[getIncomingPacketHash(chainId, sequence)][voter];
    }
}
