// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {PacketManager} from "./PacketManager.sol";
import "../../common/libraries/Lib.sol";

abstract contract OutgoingPacketManagerImpl is PacketManager {
    
    event PacketDispatched(PacketLibrary.OutPacket packet);

    function _beforeTokenBridge(uint256 destChainId) internal virtual {}
    function _afterTokenBridge(PacketLibrary.OutPacket memory packet) internal virtual {}

    // chainId => sequence number
    mapping(uint256 => uint256) public sequences;

    function _incrementSequence(uint256 _chainId) internal returns (uint256) {
        sequences[_chainId] += 1;
        return sequences[_chainId];
    }

    function sendMessage(PacketLibrary.OutPacket memory packet) external {
        _beforeTokenBridge(packet.destTokenService.chainId);

        packet.version = 1;
        packet.sequence = _incrementSequence(packet.destTokenService.chainId);

        _setOutgoingPacket(packet);
        emit PacketDispatched(packet);
        _afterTokenBridge(packet);
    }    
}
