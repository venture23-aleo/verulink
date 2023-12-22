// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import {IncomingPacketManager} from "./IncomingPacketManager.sol";
import "../../common/libraries/Lib.sol";

contract IncomingPacketManagerImpl is IncomingPacketManager {
    using PacketLibrary for PacketLibrary.InPacket;

    event PacketArrived(PacketLibrary.InPacket packet);
    event Voted(bytes32 packetHash, address voter);
    event AlreadyVoted(bytes32 packetHash, address voter);

    mapping(uint256 => mapping(uint256 => bytes32)) public incomingPackets;

    // packetHash => vote count
    mapping(bytes32 => uint256) votes;
    // packetHash => attestor address => bool
    mapping(bytes32 => mapping(address => bool)) voted;

    function _getQuorumRequired() internal view virtual returns (uint256) {
        return 0;
    }

    function _removeIncomingPacket(uint256 _chainId, uint256 _sequence) internal override virtual {
        delete incomingPackets[_chainId][_sequence];
    }

    function getIncomingPacketHash(uint256 _chainId, uint256 _sequence) public view override virtual returns (bytes32 packetHash) {
        return incomingPackets[_chainId][_sequence];
    }

    function _receivePacket(PacketLibrary.InPacket memory packet) internal {
        _preValidateInPacket(packet);
        _updateInPacketState(packet);
    }
    
    function receivePacket(PacketLibrary.InPacket memory packet) public virtual {
        _receivePacket(packet);
    }

    function receivePacketBatch(PacketLibrary.InPacket[] memory packets) public virtual {
        for(uint256 i=0;i<packets.length;i++) {
            _receivePacket(packets[i]);
        }
    }

    function _preValidateInPacket(PacketLibrary.InPacket memory packet) internal view {
        require(!isPacketConsumed(packet.sourceTokenService.chainId, packet.sequence), "Packet already consumed");
    }

    function _updateInPacketState(PacketLibrary.InPacket memory packet) internal {
        bytes32 packetHash = packet.hash();
        if(hasVoted(packetHash, msg.sender)) {
            emit AlreadyVoted(packetHash, msg.sender);
            return;
        }

        emit Voted(packetHash, msg.sender);

        voted[packetHash][msg.sender] = true;
        votes[packetHash] += 1;

        if(!hasQuorumReached(packetHash)) return;

        incomingPackets[packet.sourceTokenService.chainId][packet.sequence] = packetHash;
        emit PacketArrived(packet);
    }

    function hasQuorumReached(bytes32 packetHash) public view returns (bool) {
        return votes[packetHash] >= _getQuorumRequired();
    }

    function hasQuorumReached(uint256 chainId, uint256 sequence) public view returns (bool) {
        return hasQuorumReached(getIncomingPacketHash(chainId, sequence));
    }

    function hasVoted(bytes32 packetHash, address voter) public view returns (bool) {
        return voted[packetHash][voter];
    }

    function hasVoted(uint256 chainId, uint256 sequence, address voter) public view returns (bool) {
        return voted[getIncomingPacketHash(chainId, sequence)][voter];
    }
}