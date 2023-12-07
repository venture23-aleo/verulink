// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import {PacketManager} from "./PacketManager.sol";

abstract contract IncomingPacketManager is PacketManager {
    function _preValidateInPacket(InPacket memory packet) internal view virtual {}
    function _updateInPacketState(InPacket memory packet, uint256 action) internal virtual {}
    function _postValidateInPacket(InPacket memory packet) internal view virtual {}
}