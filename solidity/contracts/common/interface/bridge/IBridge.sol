// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {PacketLibrary} from  "../../libraries/PacketLibrary.sol";

interface IBridge {

    event PacketDispatched(PacketLibrary.OutPacket packet);
    event PacketArrived(PacketLibrary.InPacket packet);

    function isAttestor(address signer) external view returns (bool);
    function sendMessage(PacketLibrary.OutPacket memory packet) external;
    function consume(PacketLibrary.InPacket memory packet, bytes[] memory sigs) external returns (PacketLibrary.Vote);
}