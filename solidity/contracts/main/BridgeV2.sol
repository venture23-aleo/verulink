// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Bridge} from "./Bridge.sol";
import {PacketLibrary} from "../common/libraries/PacketLibrary.sol";
import {OutgoingPacketManagerImplV2} from "../base/bridge/OutgoingPacketmanagerImplV2.sol";


contract BridgeV2 is Bridge, OutgoingPacketManagerImplV2 {

     /// @notice Sends a message packet to the specified destination chain
    /// @param packet The outgoing packet to be sent
    function sendMessage(PacketLibrary.OutPacket memory packet, bytes calldata data) public virtual whenNotPaused {
        require(isSupportedChain(packet.destTokenService.chainId), "Bridge: unknown destination chain");
        require(isRegisteredTokenService(msg.sender), "Bridge: unknown token service");
        _sendMessage(packet, data);
    } 


}
