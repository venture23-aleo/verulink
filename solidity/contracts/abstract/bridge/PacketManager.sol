// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

abstract contract PacketManager {
    struct OutNetworkAddress {
        uint256 chainId;
        string addr; 
    }

    struct InNetworkAddress {
        uint256 chainId;
        address addr; 
    }
    
    struct OutTokenMessage {
        string destTokenAddress;
        uint256 amount;
        string receiverAddress;
    }

    struct InTokenMessage {
        address destTokenAddress;
        uint256 amount;
        address receiverAddress;
    }

    struct OutPacket {
        uint256 version;
        uint256 sequence;
        InNetworkAddress source;
        OutNetworkAddress destination;
        OutTokenMessage message;
        uint256 height;
    }

    struct InPacket {
        uint256 version;
        uint256 sequence;
        OutNetworkAddress source;
        InNetworkAddress destination;
        InTokenMessage message;
        uint256 height;
    }

    InNetworkAddress public self;

    function _validateConfig() internal virtual {}

    function incomingPacketExists(InPacket memory packet) public view virtual returns (bool) {}
    function _setIncomingPacket(InPacket memory packet) internal virtual {}
    function getIncomingPacket(uint256 chainId, uint256 sequence) public view virtual returns (InPacket memory) {}
    function _removeIncomingPacket(InPacket memory packet) internal virtual {}

    function isPacketConsumed(InPacket memory packet) public view virtual returns (bool){}
    function _setConsumedPacket(InPacket memory packet) internal virtual {}

    function _setOutgoingPacket(OutPacket memory packet) internal virtual {}
    function _getQuorumRequired() internal view virtual returns (uint256) {}
}