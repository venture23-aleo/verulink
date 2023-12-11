// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../Common/Ownable.sol";
import {PacketManager} from "./PacketManager.sol";

abstract contract ChainManager is Ownable {
    event ChainAdded(PacketManager.OutNetworkAddress chain);
    event ChainRemoved(uint256 chainId);

    mapping(uint256 => PacketManager.OutNetworkAddress) public chains;

    function isSupportedChain(uint256 chainId) public view returns (bool) {
        return chains[chainId].chainId != 0;
    }

    function addChain(uint256 chainId, string memory destBridgeAddress) public onlyOwner {
        require(!isSupportedChain(chainId), "Chain already supported");
        chains[chainId] = PacketManager.OutNetworkAddress(chainId, destBridgeAddress);
        emit ChainAdded(chains[chainId]);
    }

    function removeChain(uint256 chainId) public onlyOwner {
        require(isSupportedChain(chainId), "Unknown chainId");
        delete chains[chainId];
        emit ChainRemoved(chainId);
    }
}