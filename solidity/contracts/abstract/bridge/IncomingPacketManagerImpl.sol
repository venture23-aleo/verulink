// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import {IncomingPacketManager} from "./IncomingPacketManager.sol";

abstract contract IncomingPacketManagerImpl is IncomingPacketManager {
    event PacketArrived(InPacket packet);
    event Voted(bytes32 packetHash, address voter);
    event AlreadyVoted(bytes32 packetHash, address voter);

    // chainId => sequence => vote count
    // mapping(uint256 => mapping(uint256 => uint256)) public votes;
    // chainId => sequence => attestor address => bool
    // mapping(uint256 => mapping(uint256 => mapping(address => bool))) private voted;

    // packetHash => vote count
    mapping(bytes32 => uint256) votes;
    // packetHash => attestor address => bool
    mapping(bytes32 => mapping(address => bool)) voted;

    function _receivePacket(InPacket memory packet) internal {
        _preValidateInPacket(packet);
        _updateInPacketState(packet, 1);
        _postValidateInPacket(packet);
    }
    
    function receivePacket(InPacket memory packet) external {
        _validateConfig();
        _receivePacket(packet);
    }

    function receivePacketBatch(InPacket[] memory packets) external {
        _validateConfig();
        for(uint256 i=0;i<packets.length;i++) {
            _receivePacket(packets[i]);
        }
    }

    // function isRegisteredTokenService (address tokenService) public view virtual returns (bool);

    function _preValidateInPacket(InPacket memory packet) internal view override virtual {
        super._preValidateInPacket(packet);
        //if(incomingPacketExists(packet)) return;
        
        // require(self.chainId == packet.destination.chainId, "Packet not intended for this Chain");
        // require(isRegisteredTokenService(packet.destination.addr), "Unknown Token Service");
    }

    // function _updateInPacketState(InPacket memory packet, uint256 action) internal override virtual {
    //     if(action != 1) return; // 2 to represent consume operation, 1 to receive operation
    //     super._updateInPacketState(packet, action);
    //     if(hasVoted(packet, msg.sender)) {
    //         emit AlreadyVoted(packet, msg.sender);
    //         return;
    //     }
    //     emit Voted(packet, msg.sender);
    //     voted[packet.source.chainId][packet.sequence][msg.sender] = true;
    //     votes[packet.source.chainId][packet.sequence]+=1;
    //     if(hasQuorumReached(packet) && !incomingPacketExists(packet)) {
    //         _setIncomingPacket(packet);
    //     }
    // }

    function _updateInPacketState(InPacket memory packet, uint256 action) internal override virtual {
        super._updateInPacketState(packet, action);
        
        if(action != 1) return; // 2 to represent consume operation, 1 to receive operation
       if(incomingPacketExists(packet.source.chainId, packet.sequence)) return;
        
        
        bytes32 packetHash = _hash(packet);

        if(hasVoted(packetHash, msg.sender)) {
            emit AlreadyVoted(packetHash, msg.sender);
            return;
        }

        emit Voted(packetHash, msg.sender);

        voted[packetHash][msg.sender] = true;
        votes[packetHash] += 1;

        if(!hasQuorumReached(packetHash)) return;

        _setIncomingPacket(packet.source.chainId, packet.sequence, packetHash);
        emit PacketArrived(packet);
    }

    function hasQuorumReached(bytes32 packetHash) public view returns (bool) {
        return votes[packetHash] >= _getQuorumRequired();
    }

    function hasVoted(bytes32 packetHash, address voter) public view returns (bool) {
        return voted[packetHash][voter];
    }
}