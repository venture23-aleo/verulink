// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

library AleoAddressLibrary {
    // Define the Bech32m character set as a string constant
    string constant ALPHABET_INDEX_STR = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

    function getAlphabetIndex(bytes1 character) public pure returns (uint8) {
        for (uint8 i = 0; i < bytes(ALPHABET_INDEX_STR).length; i++) {
            if (bytes(ALPHABET_INDEX_STR)[i] == bytes1(character)[0]) {
                return i;
            }
        }
        revert("Character not found in alphabet");
    }

    function polymodStep(uint pre) internal pure returns (uint) {
        uint b = pre >> 25;
        return (
            ((pre & 0x1ffffff) << 5) ^
            (((b >> 0) & 1) == 0 ? 0 : 0x3b6a57b2) ^
            (((b >> 1) & 1) == 0 ? 0 : 0x26508e6d) ^
            (((b >> 2) & 1) == 0 ? 0 : 0x1ea119fa) ^
            (((b >> 3) & 1) == 0 ? 0 : 0x3d4233dd) ^
            (((b >> 4) & 1) == 0 ? 0 : 0x2a1462b3)
        );
    }

    function validateAleoAddr(string memory addr) public pure returns ( bool ) {
        require(bytes(addr).length == 63, "Invalid Aleo address length");

        bytes1[] memory addrBytes = new bytes1[](58);

        uint chk = 393502710;

        for (uint i = 0; i < addrBytes.length; i++) {
            addrBytes[i] = bytes1(bytes(addr)[i+5]);
        }

        for (uint i = 0; i < addrBytes.length; i++) {
            uint v = getAlphabetIndex(addrBytes[i]);
            chk = polymodStep(chk) ^ v;

            if (i+6 >= addrBytes.length) continue;

        }
        uint ENCODING_CONST = 0x2bc830a3;
        require(chk == ENCODING_CONST, "Invalid checksum");

        return true;

    }
}
