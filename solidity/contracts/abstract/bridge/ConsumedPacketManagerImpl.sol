// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IncomingPacketManager} from "./IncomingPacketManager.sol";

abstract contract ConsumedPacketManagerImpl is IncomingPacketManager {
    event Consumed(InPacket packet);

    function isRegisteredTokenService (address tokenService) public view virtual returns (bool);

    function _preValidateInPacket(InPacket memory packet) internal view override virtual {
        super._preValidateInPacket(packet);
        require(!isPacketConsumed(packet), "Packet already consumed");
    }

    function _updateInPacketState(InPacket memory packet, uint256 action) internal override virtual {
        super._updateInPacketState(packet, action);
        if(action != 2 || !incomingPacketExists(packet)) return; // 2 to represent consume operation, 1 to receive packet operation
        _removeIncomingPacket(packet);
        _setConsumedPacket(packet);
    }

    function consume(uint256 chainId, uint256 sequence) external returns (InPacket memory){
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
        InPacket memory packet = getIncomingPacket(chainId, sequence);
        require(packet.source.chainId != 0 && packet.sequence !=0, "Zero Packet");
        _preValidateInPacket(packet);
        _updateInPacketState(packet, 2);
        //emit Consumed(packet);
        return packet;
    }
}
