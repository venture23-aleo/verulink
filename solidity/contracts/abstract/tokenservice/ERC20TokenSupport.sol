// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../common/Ownable.sol";
import "../../common/libraries/Lib.sol";

contract ERC20TokenSupport is Ownable {

    struct Token {
        address tokenAddress;
        PacketLibrary.OutNetworkAddress destTokenAddress;
        PacketLibrary.OutNetworkAddress destTokenService;
        uint256 minValue;
        uint256 maxValue;
        bool enabled;
    }

    mapping(address => mapping(uint256 => Token)) public supportedTokens;

    event TokenAdded(Token token, uint256 destChainId);
    event TokenRemoved(address token, uint256 destChainId);
    event TokenEnabled(address token, uint256 destChainId);
    event TokenDisabled(address token, uint256 destChainId);


    function isSupportedToken(address token, uint256 destChainId) public view returns (bool) {
        return supportedTokens[token][destChainId].destTokenAddress.chainId == destChainId;
    }

    function isEnabledToken(address token, uint256 destChainId) public view returns (bool) {
        return supportedTokens[token][destChainId].enabled && isSupportedToken(token,destChainId);
    }

    function addToken(
        address tokenAddress, 
        uint256 destChainId, 
        string memory destTokenAddress,
        string memory destTokenService,
        uint256 min, 
        uint256 max) public onlyOwner {
            Token memory token = Token(tokenAddress,
                                        PacketLibrary.OutNetworkAddress(destChainId, destTokenAddress),
                                        PacketLibrary.OutNetworkAddress(destChainId, destTokenService),
                                        min,
                                        max,
                                        true
                                    );
            supportedTokens[tokenAddress][destChainId] = token;
            emit TokenAdded(token, destChainId);
    }

    function removeToken(address tokenAddress, uint256 destChainId) public onlyOwner {
        require(isSupportedToken(tokenAddress, destChainId), "Token not supported");
        emit TokenRemoved(tokenAddress, destChainId);
        delete supportedTokens[tokenAddress][destChainId];
    }

    function enable(address tokenAddress, uint256 destChainId) public onlyOwner {
        require(isSupportedToken(tokenAddress, destChainId), "Token not supported");
        supportedTokens[tokenAddress][destChainId].enabled = true;
        emit TokenEnabled(tokenAddress, destChainId);
    }

    function disable(address tokenAddress, uint256 destChainId) public onlyOwner {
        require(isEnabledToken(tokenAddress, destChainId), "Token not enabled");
        supportedTokens[tokenAddress][destChainId].enabled = true;
        emit TokenEnabled(tokenAddress, destChainId);
    }

}