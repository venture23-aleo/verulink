// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "../../common/libraries/Lib.sol";
abstract contract PacketManager {

    function _validateConfig() internal virtual {}

    function _setIncomingPacket(uint256 _chainId, uint256 _sequence, bytes32 packetHash) internal virtual {}
    function _removeIncomingPacket(uint256 _chainId, uint256 _sequence) internal virtual {}
    function incomingPacketExists(uint256 _chainId, uint256 _sequence) public view virtual returns (bool) {}
    function getIncomingPacketHash(uint256 chainId, uint256 sequence) public view virtual returns (bytes32 packetHash) {}
    

    function _setConsumedPacket(uint256 _chainId, uint256 _sequence, bytes32 packetHash) internal virtual {}
    function isPacketConsumed(uint256 _chainId, uint256 _sequence) public view virtual returns (bool){}

    function _setOutgoingPacket(PacketLibrary.OutPacket memory packet) internal virtual {}
    function _getQuorumRequired() internal view virtual returns (uint256) {}
}