// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./common/libraries/Lib.sol";
import "@thirdweb-dev/contracts/extension/Upgradeable.sol";
import "@thirdweb-dev/contracts/extension/Initializable.sol";
import {IncomingPacketManager} from "./base/bridge/IncomingPacketManager.sol";
import {IncomingPacketManagerImpl} from "./base/bridge/IncomingPacketManagerImpl.sol";
import {ConsumedPacketManagerImpl} from "./base/bridge/ConsumedPacketManagerImpl.sol";
import {OutgoingPacketManagerImpl} from "./base/bridge/OutgoingPacketManagerImpl.sol";
import {Ownable} from "./common/Ownable.sol";
import {AttestorManager} from "./base/bridge/AttestorManager.sol";
import {BridgeERC20TokenServiceManager} from "./base/bridge/BridgeERC20TokenServiceManager.sol";
import {ChainManager} from "./base/bridge/ChainManager.sol";

contract ERC20TokenBridge is IncomingPacketManager,
    IncomingPacketManagerImpl, 
    ConsumedPacketManagerImpl, 
    OutgoingPacketManagerImpl, 
    Ownable,
    AttestorManager,
    BridgeERC20TokenServiceManager,
    ChainManager,
    Initializable,
    Upgradeable
{
    function initialize(
        address _owner
    ) public override initializer {
        super.initialize(_owner);        
    }

    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == owner);
    }

    function _getQuorumRequired() internal view override returns (uint256) {
        return quorumRequired;
    }

    // function getIncomingPacketHash(uint256 chainId, uint256 sequence) public view override  returns (bytes32 packetHash) {
    //     return IncomingPacketManagerImpl.getIncomingPacketHash(chainId, sequence);
    // }

    // function _removeIncomingPacket(uint256 _chainId, uint256 _sequence) internal override {
    //     IncomingPacketManagerImpl._removeIncomingPacket(_chainId, _sequence);
    // }

    // function isPacketConsumed(uint256 _chainId, uint256 _sequence) public view override returns (bool) {
    //     return ConsumedPacketManagerImpl.isPacketConsumed(_chainId, _sequence);
    // }

    function receivePacket(PacketLibrary.InPacket memory packet, bool chainAlysisOk) public {
        _receivePacket(packet, chainAlysisOk);
        require(isAttestor(msg.sender), "Unknown Attestor");
    }

    function receivePacket(PacketLibrary.InPacket memory packet) public {
        receivePacket(packet, true);
    }

    // function receivePacketBatch(PacketLibrary.InPacket[] memory packets) public {
    //     for(uint256 i=0;i<packets.length;i++) {
    //         _receivePacket(packets[i]);
    //         require(isAttestor(msg.sender), "Unknown Attestor");
    //     }
    // }

    function consume(PacketLibrary.InPacket memory packet) public override returns (PacketLibrary.Vote) {
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
        return super.consume(packet);
    }

    function sendMessage(PacketLibrary.OutPacket memory packet) public override {
        super.sendMessage(packet);
        require(isSupportedChain(packet.destTokenService.chainId), "Unknown destination chain");
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
    } 
}