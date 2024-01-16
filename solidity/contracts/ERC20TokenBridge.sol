// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./common/libraries/Lib.sol";
import "@thirdweb-dev/contracts/extension/Upgradeable.sol";
import "@thirdweb-dev/contracts/extension/Initializable.sol";
import {IncomingPacketManager} from "./base/bridge/IncomingPacketManager.sol";
// import {IncomingPacketManagerImpl} from "./base/bridge/IncomingPacketManagerImpl.sol";
import {ConsumedPacketManagerImpl} from "./base/bridge/ConsumedPacketManagerImpl.sol";
import {OutgoingPacketManagerImpl} from "./base/bridge/OutgoingPacketManagerImpl.sol";
import {Ownable} from "./common/Ownable.sol";
import {AttestorManager} from "./base/bridge/AttestorManager.sol";
import {BridgeERC20TokenServiceManager} from "./base/bridge/BridgeERC20TokenServiceManager.sol";
import {ChainManager} from "./base/bridge/ChainManager.sol";

contract ERC20TokenBridge is IncomingPacketManager,
    ConsumedPacketManagerImpl, 
    OutgoingPacketManagerImpl, 
    Ownable,
    AttestorManager,
    BridgeERC20TokenServiceManager,
    ChainManager,
    Initializable,
    Upgradeable
{
    using PacketLibrary for PacketLibrary.InPacket;
    function initialize(
        address _owner
    ) public override initializer {
        super.initialize(_owner);        
    }

    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == owner);
    }

    function isAttestor(address signer) public view override (AttestorManager, IncomingPacketManager) returns (bool) {
        return AttestorManager.isAttestor(signer);
    }

    function consume(PacketLibrary.InPacket memory packet, bytes[] memory sigs) public returns (PacketLibrary.Vote) {
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
        bytes32 packetHash = packet.hash();
        _consume(packetHash, packet.sourceTokenService.chainId, packet.sequence, sigs, quorumRequired);
    }

    function sendMessage(PacketLibrary.OutPacket memory packet) public override {
        require(isSupportedChain(packet.destTokenService.chainId), "Unknown destination chain");
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
        super.sendMessage(packet);
    } 
}