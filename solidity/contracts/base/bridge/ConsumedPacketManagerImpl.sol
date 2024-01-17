// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IncomingPacketManager} from "./IncomingPacketManager.sol";
import "../../common/libraries/Lib.sol";

abstract contract ConsumedPacketManagerImpl is IncomingPacketManager {
    // using PacketLibrary for PacketLibrary.InPacket;

    event Consumed(uint256 chainId, uint256 sequence, bytes32 packetHash, PacketLibrary.Vote _quorum);

    // sequence => packet hash
    mapping(uint256 => bytes32) public consumedPackets;

    function isPacketConsumed(
        uint256 _sequence
    ) public view virtual override returns (bool) {
        return consumedPackets[_sequence] != bytes32(0);
    }

    function _recover(bytes32 packetHash, uint8 v, bytes32 r, bytes32 s, PacketLibrary.Vote tryVote) internal view returns (address) {
        bytes32 prefixedHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32", 
                packetHash, 
                tryVote
            )
        );
        return ecrecover(prefixedHash, v, r, s);
    }

    function _splitSignature(bytes memory sig) private view returns (uint8 v, bytes32 r, bytes32 s) {
        require(sig.length == 65);

        assembly {
            // first 32 bytes, after the length prefix.
            r := mload(add(sig, 32))
            // second 32 bytes.
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes).
            v := byte(0, mload(add(sig, 96)))
        }

        return (v, r, s);
    }

    function _checkSignatures(bytes32 packetHash, bytes[] memory sigs, uint256 threshold) internal returns (PacketLibrary.Vote) {
        address signer;
        uint256 yeaVote;
        uint256 nayVote;

        uint8 v;
        bytes32 r;
        bytes32 s;

        for(uint256 i = 0; i < sigs.length; i++) {
            (v,r,s) = _splitSignature(sigs[i]);
            signer = _recover(packetHash, v, r, s, PacketLibrary.Vote.YEA);
            if(isAttestor(signer)) {
                if(++yeaVote >= threshold) return PacketLibrary.Vote.YEA;
            }else {
                signer = _recover(packetHash, v, r, s, PacketLibrary.Vote.NAY);
                require(isAttestor(signer), "Unknown Signer");
                if(++nayVote >= threshold) return PacketLibrary.Vote.NAY;
            }
        }
        return PacketLibrary.Vote.NULL;
    }



    function _consume(
        bytes32 packetHash, 
        uint256 sourceChainId, 
        uint256 sequence,
        bytes[] memory sigs,
        uint256 threshold
    ) internal returns (PacketLibrary.Vote _quorum) {
        require(
            !isPacketConsumed(
                sequence
            ),
            "Packet already consumed"
        );
        
        consumedPackets[sequence] = packetHash;

        _quorum = _checkSignatures(packetHash, sigs, threshold);

        emit Consumed(
            sourceChainId,
            sequence,
            packetHash,
            _quorum
        );

        return _quorum;
    }
}
