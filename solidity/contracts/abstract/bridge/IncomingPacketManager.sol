// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import {PacketManager} from "./PacketManager.sol";
import "../../common/libraries/Lib.sol";

abstract contract IncomingPacketManager is PacketManager {

    function _preValidateInPacket(PacketLibrary.InPacket memory packet) internal view virtual {}
    function _updateInPacketState(PacketLibrary.InPacket memory packet, uint256 action) internal virtual {}
    function _postValidateInPacket(PacketLibrary.InPacket memory packet) internal view virtual {}

    function _hash(PacketLibrary.InPacket memory packet) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            packet.version,
            packet.sequence,
            packet.sourceTokenService.chainId,
            packet.sourceTokenService.addr,
            packet.destTokenService.chainId,
            packet.destTokenService.addr,
            packet.message.senderAddress,
            packet.message.destTokenAddress,
            packet.message.amount,
            packet.message.receiverAddress,
            packet.height)
        );
    }
}