// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../common/Ownable.sol";
import "../../common/libraries/Lib.sol";

contract ChainManager is Ownable {

    event ChainAdded(uint256 destChainId);
    event ChainRemoved(uint256 destChainId);

    uint256 public chainId;

    function isSupportedChain(uint256 destChainId) public view returns (bool) {
        return chainId == destChainId;
    }

    function addChain(uint256 destChainId) public onlyOwner {
        require(!isSupportedChain(destChainId), "Destination Chain already supported");
        chainId = destChainId;
        emit ChainAdded(destChainId);
    }

    function removeChain(uint256 destChainId) public onlyOwner {
        require(isSupportedChain(destChainId), "Unknown destination ChainId");
        chainId = 0;
        emit ChainRemoved(destChainId);
    }
}