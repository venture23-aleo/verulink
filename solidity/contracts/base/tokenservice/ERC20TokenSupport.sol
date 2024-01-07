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

    mapping(address => Token) public supportedTokens;

    event TokenAdded(Token token, uint256 destChainId);
    event TokenRemoved(address token, uint256 destChainId);
    event TokenEnabled(address token, uint256 destChainId);
    event TokenDisabled(address token, uint256 destChainId);
    event TokenMinValueUpdated(address token, uint256 destChainId, uint256 oldMinValue, uint256 newMinValue);
    event TokenMaxValueUpdated(address token, uint256 destChainId, uint256 oldMaxValue, uint256 newMaxValue);


    function isSupportedToken(
        address token,
        uint256 destChainId
    ) public view returns (bool) {
        return
            supportedTokens[token].destTokenAddress.chainId ==
            destChainId;
    }

    function isEnabledToken(
        address token,
        uint256 destChainId
    ) public view returns (bool) {
        return
            supportedTokens[token].enabled && isSupportedToken(token, destChainId);
    }

    function isAmountInRange(address tokenAddress, uint256 amount) public view returns (bool) {
        Token memory token = supportedTokens[tokenAddress];
        return amount >= token.minValue && amount <= token.maxValue;
    }

    function addToken(
        address tokenAddress,
        uint256 destChainId,
        string memory destTokenAddress,
        string memory destTokenService,
        uint256 min,
        uint256 max
    ) public onlyOwner {
        require(
            !isSupportedToken(tokenAddress, destChainId),
            "Token already supported"
        );
        Token memory token = Token(
            tokenAddress,
            PacketLibrary.OutNetworkAddress(destChainId, destTokenAddress),
            PacketLibrary.OutNetworkAddress(destChainId, destTokenService),
            min,
            max,
            true
        );
        supportedTokens[tokenAddress] = token;
        emit TokenAdded(token, destChainId);
    }

    function removeToken(
        address tokenAddress,
        uint256 destChainId
    ) public onlyOwner {
        require(
            isSupportedToken(tokenAddress, destChainId),
            "Token not supported"
        );
        emit TokenRemoved(tokenAddress, destChainId);
        delete supportedTokens[tokenAddress];
    }

    function enable(
        address tokenAddress,
        uint256 destChainId
    ) public onlyOwner {
        require(
            isEnabledToken(tokenAddress, destChainId),
            "Token not enabled"
        );
        supportedTokens[tokenAddress].enabled = true;
        emit TokenEnabled(tokenAddress, destChainId);
    }

    function disable(
        address tokenAddress,
        uint256 destChainId
    ) public onlyOwner {
        require(isEnabledToken(tokenAddress, destChainId), "Token not enabled");
        supportedTokens[tokenAddress].enabled = false;
        emit TokenDisabled(tokenAddress, destChainId);
    }

    function updateMinValue(address tokenAddress, uint256 destChainId, uint256 minValue) public onlyOwner {
        require(isSupportedToken(tokenAddress, destChainId), "Token not supported");
        emit TokenMinValueUpdated(tokenAddress, destChainId, supportedTokens[tokenAddress].minValue, minValue);
        supportedTokens[tokenAddress].minValue = minValue;
    }

    function updateMaxValue(address tokenAddress, uint256 destChainId, uint256 maxValue) public onlyOwner {
        require(isSupportedToken(tokenAddress, destChainId), "Token not supported");
        emit TokenMaxValueUpdated(tokenAddress, destChainId, supportedTokens[tokenAddress].maxValue, maxValue);
        supportedTokens[tokenAddress].maxValue = maxValue;
    }
}
