// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";

abstract contract ConsumedPacketManagerImpl {

    event Consumed(uint256 chainId, uint256 sequence, bytes32 packetHash, PacketLibrary.Vote _quorum);

    // sequence => packet hash
    mapping(uint256 => bytes32) public consumedPackets;

    function _validateAttestor(address signer) internal view virtual returns (bool);

    function isPacketConsumed(
        uint256 _sequence
    ) public virtual view returns (bool) {
        return consumedPackets[_sequence] != bytes32(0);
    }

    function _recover(bytes32 packetHash, uint8 v, bytes32 r, bytes32 s, PacketLibrary.Vote tryVote) internal pure returns (address) {
        bytes32 prefixedHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encodePacked(
                    packetHash, 
                    tryVote
                ))
            )
        );
        return ecrecover(prefixedHash, v, r, s);
    }

    function _splitSignature(bytes memory sig) internal pure returns (uint8 v, bytes32 r, bytes32 s) {

        assembly {
            // first 32 bytes, after the length prefix.
            r := mload(add(sig, 32))
            // second 32 bytes.
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes).
            v := byte(0, mload(add(sig, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        return (v, r, s);
    }

    function _checkSignatures(bytes32 packetHash, bytes[] memory sigs, uint256 threshold) internal view returns (PacketLibrary.Vote) {
        address signer;
        uint256 yeas;
        uint256 nays;

        uint8 v;
        bytes32 r;
        bytes32 s;

        for(uint256 i = 0; i < sigs.length; i++) {
            require(sigs[i].length == 65, "Invalid Signature Length");
            (v,r,s) = _splitSignature(sigs[i]);
            signer = _recover(packetHash, v, r, s, PacketLibrary.Vote.YEA);
            if(_validateAttestor(signer)) {
                if(++yeas >= threshold) return PacketLibrary.Vote.YEA;
            }else {
                signer = _recover(packetHash, v, r, s, PacketLibrary.Vote.NAY);
                require(_validateAttestor(signer), "Unknown Signer");
                if(++nays >= threshold) return PacketLibrary.Vote.NAY;
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
    ) internal virtual returns (PacketLibrary.Vote _quorum) {
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

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
