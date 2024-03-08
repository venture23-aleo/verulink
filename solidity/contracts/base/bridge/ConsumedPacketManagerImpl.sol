// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {PacketLibrary} from "../../common/libraries/PacketLibrary.sol";

/// @title ConsumedPacketManagerImpl Contract
/// @dev This abstract contract defines the structure for managing consumed packets and verifying attestations.
abstract contract ConsumedPacketManagerImpl {

    /// @dev Event triggered when a packet is consumed with a specific quorum vote
    /// @param chainId The chain identifier of the source of the packet
    /// @param sequence The sequence number of the consumed packet
    /// @param packetHash The hash of the consumed packet
    /// @param _quorum The quorum vote for the consumed packet
    event Consumed(uint256 chainId, uint256 sequence, bytes32 packetHash, PacketLibrary.Vote _quorum);

    // sequence => packet hash
    /// @dev Mapping to track consumed packets using their sequence number
    mapping(uint256 => bytes32) public consumedPackets;

    /// @dev Validates whether an address is an attestor
    /// @param signer The address to validate
    /// @return true if the address is an attestor, false otherwise
    function _validateAttestor(address signer) internal view virtual returns (bool);

    /// @notice Checks if a packet with a specific sequence number has been consumed
    /// @param _sequence The sequence number of the packet
    /// @return true if the packet has been consumed, false otherwise
    function isPacketConsumed(
        uint256 _sequence
    ) public virtual view returns (bool) {
        return consumedPackets[_sequence] != bytes32(0);
    }

    /// @dev Recovers the signer's address from a signature
    /// @param packetHash Hash of the packet being recovered
    /// @param v The recovery id as part of the signature
    /// @param r The R component of the signature
    /// @param s The S component of the signature
    /// @param tryVote The type of vote (YEA or NAY) used for recovery
    /// @return address of the recovered signer
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

    /**
     * @notice Splits signature bytes into `uint8 v, bytes32 r, bytes32 s`.
     * @dev Make sure to perform a bounds check for @param pos, to avoid out of bounds access on @param signatures
     *      The signature format is a compact form of {bytes32 r}{bytes32 s}{uint8 v}
     *      Compact means uint8 is not padded to 32 bytes.
     * @param pos Which signature to read.
     *            A prior bounds check of this parameter should be performed, to avoid out of bounds access.
     * @param signatures Concatenated {r, s, v} signatures.
     * @return v Recovery ID or Safe signature type.
     * @return r Output value r of the signature.
     * @return s Output value s of the signature.
     */
    function _signatureSplit(bytes memory signatures, uint256 pos) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        /* solhint-disable no-inline-assembly */
        /// @solidity memory-safe-assembly
        assembly {
            let signaturePos := mul(0x41, pos)
            r := mload(add(signatures, add(signaturePos, 0x20)))
            s := mload(add(signatures, add(signaturePos, 0x40)))
            v := byte(0, mload(add(signatures, add(signaturePos, 0x60))))
        }

        if (v < 27) {
            v += 27;
        }
        /* solhint-enable no-inline-assembly */
    }

    /// @dev Splits a signature into its components (v, r, s)
    /// @param sig The signature to be split
    /// @return v The recovery id as part of the signature
    /// @return r The R component of the signature
    /// @return s The S component of the signature
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
    }

    /// @dev Checks the signatures and returns the overall quorum vote
    /// @param packetHash Hash of the packet being checked
    /// @param signatures Array of signatures to be checked
    /// @param threshold Minimum number of required votes for a valid quorum
    /// @return Vote overall quorum vote (YEA, NAY, or NULL)
    function _checkSignatures(bytes32 packetHash, bytes memory signatures, uint256 threshold) internal view returns (PacketLibrary.Vote) {
        address lastAttestor = address(0);
        address currentAttestor;
        uint256 yeas;
        uint256 nays;

        uint8 v;
        bytes32 r;
        bytes32 s;
        require(signatures.length >= (threshold * 65), "ConsumedPacketManagerImpl: inadequate signatures"); 
        for(uint256 i = 0; i < threshold; i++) {
            (v,r,s) = _signatureSplit(signatures, i);
            currentAttestor = _recover(packetHash, v, r, s, PacketLibrary.Vote.NAY);

            if(_validateAttestor(currentAttestor)) {
                unchecked {
                    nays = nays + 1;
                }
            }else {
                currentAttestor = _recover(packetHash, v, r, s, PacketLibrary.Vote.YEA);
                require(_validateAttestor(currentAttestor), "ConsumedPacketManagerImpl: unknown signer");
                unchecked {
                    yeas = yeas + 1;
                }
            }
            require(currentAttestor > lastAttestor, "ConsumedPacketManagerImpl: Signers order mismatch");
            lastAttestor = currentAttestor; 
        }
        unchecked {
            if(yeas > nays && yeas >= threshold) return PacketLibrary.Vote.YEA;
            else if(nays >= threshold) return PacketLibrary.Vote.NAY;
        }
        return PacketLibrary.Vote.NULL;
    }


    /// @dev Consumes a packet by storing its hash and checking the quorum
    /// @param packetHash Hash of the packet being consumed
    /// @param sourceChainId Chain identifier of the source of the packet
    /// @param sequence Sequence number of the packet
    /// @param signatures Array of signatures attesting the packet
    /// @param threshold Minimum number of required votes for a valid quorum
    /// @return _quorum overall quorum vote (YEA, NAY, or NULL)

    function _consume(
        bytes32 packetHash, 
        uint256 sourceChainId, 
        uint256 sequence,
        bytes memory signatures,
        uint256 threshold
    ) internal virtual returns (PacketLibrary.Vote _quorum) {
        require(
            !isPacketConsumed(
                sequence
            ),
            "ConsumedPacketManagerImpl: packet already consumed"
        );
        
        consumedPackets[sequence] = packetHash;

        _quorum = _checkSignatures(packetHash, signatures, threshold);

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
