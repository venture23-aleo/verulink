// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

library PacketLibrary {
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
}
