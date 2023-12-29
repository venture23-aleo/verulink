// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../common/Ownable.sol";
import "../../common/libraries/Lib.sol";

contract ChainManager is Ownable {

    event ChainAdded(PacketLibrary.OutNetworkAddress chain);
    event ChainRemoved(uint256 destChainId);

    mapping(uint256 => PacketLibrary.OutNetworkAddress) public chains;

    function isSupportedChain(uint256 destChainId) public view returns (bool) {
        return chains[destChainId].chainId != 0;
    }

    function addChain(uint256 destChainId, string memory destBridgeAddress) public onlyOwner {
        require(!isSupportedChain(destChainId), "Destination Chain already supported");
        chains[destChainId] = PacketLibrary.OutNetworkAddress(destChainId, destBridgeAddress);
        emit ChainAdded(chains[destChainId]);
    }

    function removeChain(uint256 destChainId) public onlyOwner {
        require(isSupportedChain(destChainId), "Unknown destination ChainId");
        delete chains[destChainId];
        emit ChainRemoved(destChainId);
    }
}