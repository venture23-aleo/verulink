// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "../../common/libraries/Lib.sol";

abstract contract IncomingPacketManager {
    // function incomingPacketExists(uint256 _chainId, uint256 _sequence) public view virtual returns (bool) {}
    function getIncomingPacketHash(
        uint256 chainId,
        uint256 sequence
    ) public view virtual returns (bytes32 packetHash) {}

    function _removeIncomingPacket(
        uint256 _chainId,
        uint256 _sequence
    ) internal virtual {}

    function isPacketConsumed(
        uint256 _chainId,
        uint256 _sequence
    ) public view virtual returns (bool) {}

    function _getQuorumRequired(
        uint256
    ) internal view virtual returns (uint256) {}
}
