// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "../common/libraries/Lib.sol";
import {Pausable} from "../common/Pausable.sol";
import {AttestorManager} from "../base/bridge/AttestorManager.sol";
import {BridgeTokenServiceManager} from "../base/bridge/BridgeTokenServiceManager.sol";
import {ConsumedPacketManagerImpl} from "../base/bridge/ConsumedPacketManagerImpl.sol";
import {OutgoingPacketManagerImpl} from "../base/bridge/OutgoingPacketManagerImpl.sol";
import "@thirdweb-dev/contracts/extension/Initializable.sol";

contract ERC20TokenBridge is 
    Pausable,
    AttestorManager,
    BridgeTokenServiceManager,
    ConsumedPacketManagerImpl,
    OutgoingPacketManagerImpl,
    Initializable
{
    using PacketLibrary for PacketLibrary.InPacket;
    
    event ChainUpdated(uint256 oldDestinationChainId, uint256 newDestinationChainId);

    uint256 public destinationChainId;

    function initialize(
        address _owner,
        uint256 _destChainId
    ) public initializer {
        super._initialize(_owner);
        destinationChainId = _destChainId;       
    }

    function isSupportedChain(uint256 destChainId) public view onlyProxy returns (bool) {
        return destinationChainId == destChainId;
    }

    function updateDestinationChainId(uint256 newDestChainId) public onlyOwner onlyProxy {
        require(!isSupportedChain(newDestChainId), "Destination Chain already supported");
        emit ChainUpdated(destinationChainId, newDestChainId);
        destinationChainId = newDestChainId;
    }

    function _validateAttestor(address signer) internal view override returns (bool) {
        return isAttestor(signer);
    }

    function consume(PacketLibrary.InPacket memory packet, bytes[] memory sigs) public 
    onlyProxy 
    whenNotPaused 
    returns (PacketLibrary.Vote)
    {
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
        return _consume(packet.hash(), packet.sourceTokenService.chainId, packet.sequence, sigs, quorumRequired);
    }

    function sendMessage(PacketLibrary.OutPacket memory packet) public override 
    onlyProxy 
    whenNotPaused 
    {
        require(isSupportedChain(packet.destTokenService.chainId), "Unknown destination chain");
        require(isRegisteredTokenService(msg.sender), "Unknown Token Service");
        super.sendMessage(packet);
    } 
}