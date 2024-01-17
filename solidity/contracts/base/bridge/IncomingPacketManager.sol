// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "../../common/libraries/Lib.sol";

abstract contract IncomingPacketManager {
    function isPacketConsumed(uint256 _sequence) public view virtual returns (bool);
    function isAttestor(address signer) public view virtual returns (bool);
}
