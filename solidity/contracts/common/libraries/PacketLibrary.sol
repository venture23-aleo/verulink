// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

/// @title PacketLibrary
/// @dev A library for handling packet structures and hashing.
library PacketLibrary {

        /// @notice The version of the contract
    uint256 constant VERSION_PUBLIC_TRANSFER = 1;
    uint256 constant VERSION_PUBLIC_TRANSFER_EXECUTOR = 2;
    uint256 constant VERSION_PUBLIC_TRANSFER_PREDICATE = 3;
    uint256 constant VERSION_PUBLIC_TRANSFER_PREDICATE_EXECUTOR = 4;

    uint256 constant VERSION_PRIVATE_TRANSFER = 11;
    uint256 constant VERSION_PRIVATE_TRANSFER_EXECUTOR = 12;
    uint256 constant VERSION_PRIVATE_TRANSFER_PREDICATE = 13;
    uint256 constant VERSION_PRIVATE_TRANSFER_PREDICATE_EXECUTOR = 14;



    /// @notice Enum representing vote options in a packet.
    enum Vote {
        NULL,
        YEA,
        NAY
    }
    
    /// @notice Struct representing the network address of the destination for outgoing packets.
    struct OutNetworkAddress {
        uint256 chainId;
        string addr;
    }

    /// @notice Struct representing the network address of the source for incoming packets.
    struct InNetworkAddress {
        uint256 chainId;
        address addr;
    }

    /// @notice Struct representing the message for outgoing token packets.
    struct OutTokenMessage {
        address senderAddress;
        string destTokenAddress;
        uint256 amount;
        string receiverAddress;
    }

    /// @notice Struct representing the message for incoming token packets.
    struct InTokenMessage {
        string senderAddress;
        address destTokenAddress;
        uint256 amount;
        address receiverAddress;
    }

    /// @notice Struct representing the structure of outgoing packets.
    struct OutPacket {
        uint256 version;
        uint256 sequence;
        InNetworkAddress sourceTokenService;
        OutNetworkAddress destTokenService;
        OutTokenMessage message;
        uint256 height;
    }

    /// @notice Struct representing the structure of incoming packets.
    struct InPacket {
        uint256 version;
        uint256 sequence;
        OutNetworkAddress sourceTokenService;
        InNetworkAddress destTokenService;
        InTokenMessage message;
        uint256 height;
    }

    /// @notice Computes the hash of an incoming packet.
    /// @param packet The incoming packet to hash.
    /// @return hash of the packet.
    function hash(PacketLibrary.InPacket memory packet) public pure returns (bytes32) {
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

    /// @notice Computes the hash of an outgoing packet.
    /// @param packet The outgoing packet to hash.
    /// @return hash of the packet.
    function hash(PacketLibrary.OutPacket memory packet) internal pure returns (bytes32) {
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
