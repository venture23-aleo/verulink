// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IncomingPacketManager} from "./IncomingPacketManager.sol";

abstract contract ConsumedPacketManagerImpl is IncomingPacketManager {
    event Consumed(InPacket packet);

    function isRegisteredTokenService (address tokenService) public view virtual returns (bool);

    function _preValidateInPacket(InPacket memory packet) internal view override virtual {
        super._preValidateInPacket(packet);
        require(!isPacketConsumed(packet.destination.chainId, packet.sequence), "Packet already consumed");
    }

    function _updateInPacketState(InPacket memory packet, uint256 action) internal override virtual {
        super._updateInPacketState(packet, action);
        if(action != 2 || !incomingPacketExists(packet.destination.chainId, packet.sequence)) return; // 2 to represent consume operation, 1 to receive packet operation
        _removeIncomingPacket(packet.destination.chainId, packet.sequence);
        _setConsumedPacket(packet.destination.chainId, packet.sequence, _hash(packet));
    }

    function consume(InPacket memory packet) external returns (InPacket memory){
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
        require(getIncomingPacketHash(packet.destination.chainId, packet.sequence) == _hash(packet), "Unknown Packet");
        _preValidateInPacket(packet);
        _updateInPacketState(packet, 2);
        return packet;
    }
}