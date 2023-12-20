// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "../../common/libraries/Lib.sol";

abstract contract IncomingPacketManager  {    
    function incomingPacketExists(uint256 _chainId, uint256 _sequence) public view virtual returns (bool) {}
    function getIncomingPacketHash(uint256 chainId, uint256 sequence) public view virtual returns (bytes32 packetHash) {}
    function _removeIncomingPacket(uint256 _chainId, uint256 _sequence) internal virtual {}

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