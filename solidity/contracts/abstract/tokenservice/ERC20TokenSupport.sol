// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../Common/Ownable.sol";
import {IERC20TokenBridge} from "../../Common/Interface/bridge/IERC20TokenBridge.sol";

abstract contract ERC20TokenSupport is Ownable {
    struct Token {
        address tokenAddress;
        IERC20TokenBridge.OutNetworkAddress destTokenAddress;
        IERC20TokenBridge.OutNetworkAddress destTokenService;
        uint256 minValue;
        uint256 maxValue;
        bool enabled;
    }

    mapping(address => Token) public supportedTokens;

    event TokenAdded(Token token);

    function isSupportedToken(address token) public view returns (bool) {
        return supportedTokens[token].tokenAddress == token;
    }

    function isSupportedToken(address token, uint256 destChainId) public view returns (bool) {
        return supportedTokens[token].destTokenAddress.chainId == destChainId;
    }

    function addToken(
        address tokenAddress, 
        uint256 destChainId, 
        string memory destTokenAddress,
        string memory destTokenService,
        uint256 min, 
        uint256 max) public onlyOwner {
            Token memory token = Token(tokenAddress,
                                        IERC20TokenBridge.OutNetworkAddress(destChainId, destTokenAddress),
                                        IERC20TokenBridge.OutNetworkAddress(destChainId, destTokenService),
                                        min,
                                        max,
                                        true);
            supportedTokens[tokenAddress] = token;
            emit TokenAdded(token);
    }

    function removeToken(address tokenAddress) public onlyOwner {
        require(isSupportedToken(tokenAddress), "Token not supported");
        delete supportedTokens[tokenAddress];
    }
}