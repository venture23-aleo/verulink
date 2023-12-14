// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "../../libraries/Lib.sol";

abstract contract IERC20TokenBridge {

    event PacketDispatched(PacketLibrary.OutPacket packet);
    event PacketArrived(PacketLibrary.InPacket packet);

    function sendMessage(PacketLibrary.OutPacket memory packet) external virtual;
    function consume(PacketLibrary.InPacket memory packet) external virtual returns (PacketLibrary.InPacket memory);
}