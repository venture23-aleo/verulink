// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./common/libraries/Lib.sol";
import "@thirdweb-dev/contracts/extension/Upgradeable.sol";
import {IncomingPacketManager} from "./abstract/bridge/IncomingPacketManager.sol";
import {IncomingPacketManagerImpl} from "./abstract/bridge/IncomingPacketManagerImpl.sol";
import {ConsumedPacketManagerImpl} from "./abstract/bridge/ConsumedPacketManagerImpl.sol";
import {OutgoingPacketManagerImpl} from "./abstract/bridge/OutgoingPacketManagerImpl.sol";
import {Ownable} from "./common/Ownable.sol";
import {AttestorManager} from "./abstract/bridge/AttestorManager.sol";
import {BridgeERC20TokenServiceManager} from "./abstract/bridge/BridgeERC20TokenServiceManager.sol";
import {ChainManager} from "./abstract/bridge/ChainManager.sol";

contract ERC20TokenBridge is IncomingPacketManager,
    IncomingPacketManagerImpl, 
    ConsumedPacketManagerImpl, 
    OutgoingPacketManagerImpl, 
    Ownable,
    AttestorManager,
    BridgeERC20TokenServiceManager,
    ChainManager,
    Upgradeable
{
    function initialize(
        address _owner
    ) public override initializer {
        super.initialize(_owner);        
    }

    //     function test() external{
    
//     PacketLibrary.OutTokenMessage memory message = PacketLibrary.OutTokenMessage(
//             "destTokenAddress", 
//             112000000, 
//             "receiverAddress"
//         );
//         PacketLibrary.InNetworkAddress memory self = PacketLibrary.InNetworkAddress(
//             1, 
//             address(this)
//         );
//         PacketLibrary.OutNetworkAddress memory target = PacketLibrary.OutNetworkAddress(
//             2,
//             "target"
//         );

//         PacketLibrary.OutPacket memory packet ;
//         packet.version = 1;
//         packet.sequence = 13;
//         packet.source = self;
//         packet.destination = target;
//         packet.message = message;
//         packet.height = block.number; 
//         _setOutgoingPacket(packet);
//         emit PacketDispatched(packet);
   
// }

    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == owner);
    }

    function _getQuorumRequired(uint256 chainId) internal view override returns (uint256) {
        return quorumRequired[chainId];
    }

    // function incomingPacketExists(uint256 _chainId, uint256 _sequence) public view override (IncomingPacketManager, IncomingPacketManagerImpl) returns (bool) {
    //     return IncomingPacketManagerImpl.incomingPacketExists(_chainId, _sequence);
    // } 

    function getIncomingPacketHash(uint256 chainId, uint256 sequence) public view override (IncomingPacketManager, IncomingPacketManagerImpl) returns (bytes32 packetHash) {
        return IncomingPacketManagerImpl.getIncomingPacketHash(chainId, sequence);
    }

    function _removeIncomingPacket(uint256 _chainId, uint256 _sequence) internal override (IncomingPacketManager, IncomingPacketManagerImpl) {
        IncomingPacketManagerImpl._removeIncomingPacket(_chainId, _sequence);
    }

    function isPacketConsumed(uint256 _chainId, uint256 _sequence) public view override (IncomingPacketManager, ConsumedPacketManagerImpl) returns (bool) {
        return ConsumedPacketManagerImpl.isPacketConsumed(_chainId, _sequence);
    }

    function receivePacket(PacketLibrary.InPacket memory packet) public {
        _receivePacket(packet);
        require(isAttestor(msg.sender,packet.sourceTokenService.chainId), "Unknown Attestor");
    }

    function receivePacketBatch(PacketLibrary.InPacket[] memory packets) public {
        for(uint256 i=0;i<packets.length;i++) {
            _receivePacket(packets[i]);
            require(isAttestor(msg.sender,packets[i].sourceTokenService.chainId), "Unknown Attestor");
        }
    }

    function consume(PacketLibrary.InPacket memory packet) public override {
        super.consume(packet);
        require(isRegisteredTokenService(msg.sender, packet.sourceTokenService.chainId), "Unknown Token Service");
    }

    function sendMessage(PacketLibrary.OutPacket memory packet) public override {
        super.sendMessage(packet);
        require(isRegisteredTokenService(msg.sender, packet.destTokenService.chainId), "Unknown Token Service");
        require(isSupportedChain(packet.destTokenService.chainId), "Unknown destination chain");
    } 
}