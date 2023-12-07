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
    mapping(uint256 => mapping(uint256 => bytes32)) public incomingPackets;
    mapping(uint256 => mapping(uint256 => bytes32)) public consumedPackets;
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
    
    function _setIncomingPacket(uint256 _chainId, uint256 _sequence, bytes32 packetHash) internal override {
        incomingPackets[_chainId][_sequence] = packetHash;
    }

    function getIncomingPacketHash(uint256 _chainId, uint256 sequence) public view override returns (bytes32 packetHash) {
        return incomingPackets[_chainId][sequence];
    }

    function _removeIncomingPacket(uint256 _chainId, uint256 _sequence) internal override {
        delete incomingPackets[_chainId][_sequence];
    }

    function _beforeTokenBridge(uint256 destChainId) internal override {
        super._beforeTokenBridge(destChainId);
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
        require(isSupportedChain(destChainId), "Unknown destination chain");
    }

    function isPacketConsumed(uint256 _chainId, uint256 _sequence) public view override returns (bool) {
        return consumedPackets[_chainId][_sequence] != bytes32(0);
    }

    function _setConsumedPacket(uint256 _chainId, uint256 _sequence, bytes32 packetHash) internal override {
        consumedPackets[_chainId][_sequence] = packetHash;
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
}