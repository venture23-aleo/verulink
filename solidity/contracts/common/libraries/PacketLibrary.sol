// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

library PacketLibrary {
    enum Vote {
        NULL,
        YEA,
        NAY
    }
    
    struct OutNetworkAddress {
        uint256 chainId;
        string addr;
    }

    struct InNetworkAddress {
        uint256 chainId;
        address addr;
    }

    struct OutTokenMessage {
        address senderAddress;
        string destTokenAddress;
        uint256 amount;
        string receiverAddress;
    }

    struct InTokenMessage {
        string senderAddress;
        address destTokenAddress;
        uint256 amount;
        address receiverAddress;
    }

    struct OutPacket {
        uint256 version;
        uint256 sequence;
        InNetworkAddress sourceTokenService;
        OutNetworkAddress destTokenService;
        OutTokenMessage message;
        uint256 height;
    }

    struct InPacket {
        uint256 version;
        uint256 sequence;
        OutNetworkAddress sourceTokenService;
        InNetworkAddress destTokenService;
        InTokenMessage message;
        uint256 height;
    }

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

    function strlen(string memory s) public pure returns (uint256) {
        uint256 len;
        uint256 i = 0;
        uint256 bytelength = bytes(s).length;

        for (len = 0; i < bytelength; len++) {
            bytes1 b = bytes(s)[i];
            if (b < 0x80) {
                i += 1;
            } else if (b < 0xE0) {
                i += 2;
            } else if (b < 0xF0) {
                i += 3;
            } else if (b < 0xF8) {
                i += 4;
            } else if (b < 0xFC) {
                i += 5;
            } else {
                i += 6;
            }
        }
        return len;
    }
}
