// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import {PacketManager} from "./PacketManager.sol";

abstract contract IncomingPacketManager is PacketManager {
    function _preValidateInPacket(InPacket memory packet) internal view virtual {}
    function _updateInPacketState(InPacket memory packet, uint256 action) internal virtual {}
    function _postValidateInPacket(InPacket memory packet) internal view virtual {}

    function _hash(InPacket memory packet) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            packet.version,
            packet.sequence,
            packet.source.chainId,
            packet.source.addr,
            packet.destination.chainId,
            packet.destination.addr,
            packet.message.destTokenAddress,
            packet.message.amount,
            packet.message.receiverAddress,
            packet.height)
        );
    }
}