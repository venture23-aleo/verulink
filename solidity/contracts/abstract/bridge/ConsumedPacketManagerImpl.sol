// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IncomingPacketManager} from "./IncomingPacketManager.sol";
import "../../common/libraries/Lib.sol";

abstract contract ConsumedPacketManagerImpl is IncomingPacketManager {

    event Consumed(bytes32 packetHash);

    function isRegisteredTokenService (address tokenService) public view virtual returns (bool);

    function _preValidateInPacket(PacketLibrary.InPacket memory packet) internal view override virtual {
        super._preValidateInPacket(packet);
        require(!isPacketConsumed(packet.destTokenService.chainId, packet.sequence), "Packet already consumed");
    }

    function _updateInPacketState(PacketLibrary.InPacket memory packet, uint256 action) internal override virtual {
        super._updateInPacketState(packet, action);
        if(action != 2 || !incomingPacketExists(packet.destTokenService.chainId, packet.sequence)) return; // 2 to represent consume operation, 1 to receive packet operation
        _removeIncomingPacket(packet.destTokenService.chainId, packet.sequence);
        _setConsumedPacket(packet.destTokenService.chainId, packet.sequence, _hash(packet));
    }

    function consume(PacketLibrary.InPacket memory packet) external {
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
        bytes32 packetHash = getIncomingPacketHash(packet.destTokenService.chainId, packet.sequence);
        require(packetHash == _hash(packet), "Unknown Packet");
        _preValidateInPacket(packet);
        _updateInPacketState(packet, 2);
        emit Consumed(packetHash);
    }
}