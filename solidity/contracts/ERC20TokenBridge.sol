// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./common/libraries/Lib.sol";
import "@thirdweb-dev/contracts/extension/Upgradeable.sol";
import "@thirdweb-dev/contracts/extension/Initializable.sol";
import {IncomingPacketManagerImpl} from "./abstract/bridge/IncomingPacketManagerImpl.sol";
import {ConsumedPacketManagerImpl} from "./abstract/bridge/ConsumedPacketManagerImpl.sol";
import {OutgoingPacketManagerImpl} from "./abstract/bridge/OutgoingPacketManagerImpl.sol";
import {Ownable} from "./common/Ownable.sol";
import {AttestorManager} from "./abstract/bridge/AttestorManager.sol";
import {BridgeTokenServiceManager} from "./abstract/bridge/BridgeTokenServiceManager.sol";
import {ChainManager} from "./abstract/bridge/ChainManager.sol";

contract ERC20TokenBridge is IncomingPacketManagerImpl, 
    ConsumedPacketManagerImpl, 
    OutgoingPacketManagerImpl, 
    Ownable,
    AttestorManager,
    BridgeTokenServiceManager,
    ChainManager,
    Upgradeable,
    Initializable
{
    function _preValidateInPacket(PacketLibrary.InPacket memory packet) internal view override (IncomingPacketManagerImpl, ConsumedPacketManagerImpl) {
        // require(isSupportedChain(packet.source.chainId), "Unknown chainId");
        super._preValidateInPacket(packet);
    }

    function _updateInPacketState(PacketLibrary.InPacket memory packet, uint256 action) internal override (IncomingPacketManagerImpl, ConsumedPacketManagerImpl) {
        super._updateInPacketState(packet, action);
    }
    
    function initialize(
        address _owner
    ) external initializer{
        owner = _owner;

        // addAttestor(msg.sender, 1);
        
        //addChain(2, "target");
        // addChain(1, "self");

        // PacketLibrary.InNetworkAddress(
        //     _chainId, 
        //     address(this)
        // );
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

    function _getQuorumRequired() internal view override returns (uint256) {
        return quorumRequired;
    }

    function receivePacket(PacketLibrary.InPacket memory packet) public override {
        super.receivePacket(packet);
        require(isAttestor(msg.sender), "Unknown Attestor");
    }

    function receivePacketBatch(PacketLibrary.InPacket[] memory packets) public override {
        super.receivePacketBatch(packets);
       require(isAttestor(msg.sender), "Unknown Attestor");
    }

    function consume(PacketLibrary.InPacket memory packet) public override {
        super.consume(packet);
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
    }

    function sendMessage(PacketLibrary.OutPacket memory packet) public override {
        super.sendMessage(packet);
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
        require(isSupportedChain(packet.destTokenService.chainId), "Unknown destination chain");
    }  
}