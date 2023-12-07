// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {PacketManager} from "./abstract/bridge/PacketManager.sol";
import {IncomingPacketManagerImpl} from "./abstract/bridge/IncomingPacketManagerImpl.sol";
import {ConsumedPacketManagerImpl} from "./abstract/bridge/ConsumedPacketManagerImpl.sol";
import {OutgoingPacketManagerImpl} from "./abstract/bridge/OutgoingPacketManagerImpl.sol";
import {Ownable} from "./Common/Ownable.sol";
import {AttestorManager} from "./abstract/bridge/AttestorManager.sol";
import {BridgeTokenServiceManager} from "./abstract/bridge/BridgeTokenServiceManager.sol";
import {ChainManager} from "./abstract/bridge/ChainManager.sol";


contract ERC20TokenBridge is PacketManager, 
    IncomingPacketManagerImpl, 
    ConsumedPacketManagerImpl, 
    OutgoingPacketManagerImpl, 
    Ownable,
    AttestorManager,
    BridgeTokenServiceManager,
    ChainManager
{
    // chainId => sequence => Packet
    mapping(uint256 => mapping(uint256 => InPacket)) private incomingPackets;
    mapping(uint256 => mapping(uint256 => InPacket)) public consumedPackets;
    mapping(uint256 => mapping(uint256 => OutPacket)) public outgoingPackets;

    function isRegisteredTokenService(address tokenService) public view override(BridgeTokenServiceManager, ConsumedPacketManagerImpl) returns(bool) {
        return tokenServices[tokenService];
    }
    
    function _preValidateInPacket(InPacket memory packet) internal view override (IncomingPacketManagerImpl, ConsumedPacketManagerImpl) {
        // require(isSupportedChain(packet.source.chainId), "Unknown chainId");
        super._preValidateInPacket(packet);
    }

    function _updateInPacketState(InPacket memory packet, uint256 action) internal override (IncomingPacketManagerImpl, ConsumedPacketManagerImpl) {
        super._updateInPacketState(packet, action);
    }

    constructor(uint256 _chainId) {
        owner = msg.sender;
        addAttestor(msg.sender, 1);
        
        //addChain(2, "target");
        //addChain(1, "self");

        self = InNetworkAddress(
            _chainId, 
            address(this)
        );
    }

    function incomingPacketExists(InPacket memory packet) public view override returns (bool) {
        return incomingPackets[packet.source.chainId][packet.sequence].sequence == packet.sequence;
    }
    
    function _setIncomingPacket(InPacket memory packet) internal override {
        incomingPackets[packet.source.chainId][packet.sequence] = packet;
    }

    function getIncomingPacket(uint256 _chainId, uint256 sequence) public view override returns (InPacket memory) {
        return incomingPackets[_chainId][sequence];
    }

    function _removeIncomingPacket(InPacket memory packet) internal override {
        delete incomingPackets[packet.source.chainId][packet.sequence];
    }

    function _beforeTokenBridge(uint256 destChainId) internal override {
        super._beforeTokenBridge(destChainId);
        require(isRegisteredTokenService(msg.sender), "Caller is not registered Token Service");
        require(isSupportedChain(destChainId), "Destination Chain not supported");
    }

    function isPacketConsumed(InPacket memory packet) public view override returns (bool) {
        return consumedPackets[packet.source.chainId][packet.sequence].sequence == packet.sequence;
    }

    function _setConsumedPacket(InPacket memory packet) internal override {
        consumedPackets[packet.source.chainId][packet.sequence] = packet;
    }

    function _setOutgoingPacket(OutPacket memory packet) internal override {
        outgoingPackets[packet.destination.chainId][packet.sequence] = packet;
    }

    function _validateConfig() internal view override {
        require(isAttestor(msg.sender), "Unknown Attestor");
    }

    function _getQuorumRequired() internal view override returns (uint256) {
        return quorumRequired;
    }

    function chainId() public view returns (uint256) {
        return self.chainId;
    }
}