// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../common/Ownable.sol";
import "../../common/libraries/Lib.sol";

contract ChainManager is Ownable {

    event ChainAdded(PacketLibrary.OutNetworkAddress chain);
    event ChainRemoved(uint256 chainId);

    mapping(uint256 => PacketLibrary.OutNetworkAddress) public chains;

    function initialize(
        address _owner
    ) public virtual override {
        super.initialize(_owner);
    }

    function isSupportedChain(uint256 chainId) public view returns (bool) {
        return chains[chainId].chainId != 0;
    }

    function addChain(uint256 chainId, string memory destBridgeAddress) public onlyOwner {
        require(!isSupportedChain(chainId), "Chain already supported");
        chains[chainId] = PacketLibrary.OutNetworkAddress(chainId, destBridgeAddress);
        emit ChainAdded(chains[chainId]);
    }

    function removeChain(uint256 chainId) public onlyOwner {
        require(isSupportedChain(chainId), "Unknown chainId");
        delete chains[chainId];
        emit ChainRemoved(chainId);
    }
}