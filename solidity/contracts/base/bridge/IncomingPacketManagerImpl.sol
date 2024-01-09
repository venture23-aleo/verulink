// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import {IncomingPacketManager} from "./IncomingPacketManager.sol";
import "../../common/libraries/Lib.sol";

abstract contract IncomingPacketManagerImpl is IncomingPacketManager {
    using PacketLibrary for PacketLibrary.InPacket;

    event PacketArrived(PacketLibrary.InPacket packet);
    event Voted(bytes32 packetHash, PacketLibrary.Vote vote, address voter);
    event AlreadyVoted(bytes32 packetHash, address voter);

    mapping(uint256 => mapping(uint256 => bytes32)) public incomingPackets;

    // packetHash => vote count
    mapping(bytes32 => mapping(PacketLibrary.Vote => uint256)) totalVotes;
    // packetHash => attestor address => bool
    mapping(bytes32 => mapping(address => PacketLibrary.Vote)) vote;
    mapping(uint256 => mapping(uint256 => mapping(address => bytes32))) beforeQuorumPacketHash;

    function voteCount(bytes32 packetHash, PacketLibrary.Vote _vote) public view returns (uint256 count) {
        return totalVotes[packetHash][_vote];
    }

    function voteCount(uint256 _chainId, uint256 _sequence, PacketLibrary.Vote _vote) public view returns (uint256 count) {
        return totalVotes[getIncomingPacketHash(_chainId, _sequence)][_vote];
    }

    function _removeIncomingPacket(
        uint256 _chainId,
        uint256 _sequence
    ) internal virtual override {
        delete incomingPackets[_chainId][_sequence];
        // delete beforeQuorumPacketHash[_chainId][_sequence][sender];
    }

    function getIncomingPacketHash(
        uint256 _chainId,
        uint256 _sequence
    ) public view virtual override returns (bytes32 packetHash) {
        return incomingPackets[_chainId][_sequence];
    }

    function _receivePacket(PacketLibrary.InPacket memory packet, bool chainAlysisOk) internal {
        uint256 sourceChainId = packet.sourceTokenService.chainId;
        uint256 sequence = packet.sequence;
        address sender = msg.sender;
        require(
            !isPacketConsumed(
                sourceChainId,
                sequence
            ),
            "Packet already consumed"
        );
        bytes32 packetHash = packet.hash();
        if (hasVoted(sourceChainId, sequence, sender) != PacketLibrary.Vote.NULL) {
            emit AlreadyVoted(packetHash, sender);
            return;
        }

        PacketLibrary.Vote attesterVote = chainAlysisOk? PacketLibrary.Vote.YEA: PacketLibrary.Vote.NAY;

        emit Voted(packetHash, attesterVote, sender);

        vote[packetHash][sender] = attesterVote;
        totalVotes[packetHash][attesterVote] += 1;
        beforeQuorumPacketHash[sourceChainId][sequence][sender] = packetHash;

        if (!hasQuorumReached(packetHash))
            return;

        incomingPackets[sourceChainId][
            sequence
        ] = packetHash;
        emit PacketArrived(packet);
    }

    function quorum(bytes32 packetHash) public view override returns (PacketLibrary.Vote) {
        if(voteCount(packetHash, PacketLibrary.Vote.YEA) >= _getQuorumRequired()) return PacketLibrary.Vote.YEA;
        if(voteCount(packetHash, PacketLibrary.Vote.NAY) >= _getQuorumRequired()) return PacketLibrary.Vote.NAY;
        return PacketLibrary.Vote.NULL;
    }

    function quorum(uint256 _chainId, uint256 _sequence, address sender) public view returns (PacketLibrary.Vote) {
        return quorum(beforeQuorumPacketHash[_chainId][_sequence][sender]);
    }

    function hasQuorumReached(
        bytes32 packetHash
    ) public view returns (bool) {
        return (quorum(packetHash) != PacketLibrary.Vote.NULL);
    }

    function hasQuorumReached(
        uint256 _chainId,
        uint256 _sequence,
        address sender
    ) public view returns (bool) {
        return
            hasQuorumReached(beforeQuorumPacketHash[_chainId][_sequence][sender]);
    }

    function hasVoted(
        bytes32 packetHash,
        address voter
    ) public view returns (PacketLibrary.Vote) {
        return vote[packetHash][voter];
    }

    function hasVoted(
        uint256 _chainId,
        uint256 _sequence,
        address _voter
    ) public view returns (PacketLibrary.Vote) {
        return vote[beforeQuorumPacketHash[_chainId][_sequence][_voter]][_voter];
    }
}
