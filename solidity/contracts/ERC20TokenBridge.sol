// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "./common/libraries/Lib.sol";
import "@thirdweb-dev/contracts/extension/Upgradeable.sol";
import "@thirdweb-dev/contracts/extension/Initializable.sol";
import {Ownable} from "./common/Ownable.sol";
import {AttestorManager} from "./base/bridge/AttestorManager.sol";
import {BridgeTokenServiceManager} from "./base/bridge/BridgeTokenServiceManager.sol";
import {ConsumedPacketManagerImpl} from "./base/bridge/ConsumedPacketManagerImpl.sol";
import {OutgoingPacketManagerImpl} from "./base/bridge/OutgoingPacketManagerImpl.sol";

contract ERC20TokenBridge is 
    Ownable,
    AttestorManager,
    BridgeTokenServiceManager,
    ConsumedPacketManagerImpl,
    OutgoingPacketManagerImpl,
    Initializable,
    Upgradeable
{
    using PacketLibrary for PacketLibrary.InPacket;
    
    event ChainUpdated(uint256 oldDestinationChainId, uint256 newDestinationChainId);

    uint256 destinationChainId;

    function initialize(
        address _owner,
        uint256 _destChainId
    ) public initializer {
        super.initialize(_owner);
        destinationChainId = _destChainId;       
    }

    function isSupportedChain(uint256 destChainId) public view returns (bool) {
        return destinationChainId == destChainId;
    }

    function updateDestinationChainId(uint256 newDestChainId) public onlyOwner {
        require(!isSupportedChain(newDestChainId), "Destination Chain already supported");
        emit ChainUpdated(destinationChainId, newDestChainId);
        destinationChainId = newDestChainId;
    }

    function _authorizeUpgrade(address) internal view override {
        require(msg.sender == owner);
    }

    function _validateAttestor(address signer) internal view override returns (bool) {
        return isAttestor(signer);
    }

    function consume(PacketLibrary.InPacket memory packet, bytes[] memory sigs) public returns (PacketLibrary.Vote) {
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
        _consume(packet.hash(), packet.sourceTokenService.chainId, packet.sequence, sigs, quorumRequired);
    }

    function sendMessage(PacketLibrary.OutPacket memory packet) public override {
        require(isSupportedChain(packet.destTokenService.chainId), "Unknown destination chain");
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
        super.sendMessage(packet);
    } 
}