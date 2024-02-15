// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IVaultService} from "../../common/interface/tokenservice/IVaultService.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

abstract contract TokenSupport is OwnableUpgradeable {
    uint256 public destChainId;

    struct Token {
        address tokenAddress;
        IVaultService vault;
        string destTokenAddress;
        string destTokenService;
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

    function __TokenSupport_init(uint256 _destChainId) internal onlyInitializing {
        __Ownable_init_unchained();
        destChainId = _destChainId;
        // __TokenSupport_init_unchained(_destChainId);
    }

    // function __TokenSupport_init_unchained(uint256 _destChainId) internal onlyInitializing {
    //     destChainId = _destChainId;
    // }

    function isSupportedToken(
        address token
    ) public view returns (bool) {
        return
            address(supportedTokens[token].vault) != address(0);
    }

    function isEnabledToken(
        address token
    ) public view returns (bool) {
        return
            supportedTokens[token].enabled && isSupportedToken(token);
    }

    function isAmountInRange(address tokenAddress, uint256 amount) public view returns (bool) {
        Token memory token = supportedTokens[tokenAddress];
        return amount >= token.minValue && amount <= token.maxValue;
    }

    function _addToken(
        address tokenAddress,
        uint256 _destChainId,
        address vault,
        string memory destTokenAddress,
        string memory destTokenService,
        uint256 min,
        uint256 max
    ) internal {
        require(
            !isSupportedToken(tokenAddress),
            "Token already supported"
        );
        require(_destChainId == destChainId, "Target Chain Mismatch");
        Token memory token = Token(
            tokenAddress,
            IVaultService(vault),
            destTokenAddress,
            destTokenService,
            min,
            max,
            true
        );
        supportedTokens[tokenAddress] = token;
        emit TokenAdded(token, destChainId);
    }    

    function addToken(
        address tokenAddress,
        uint256 _destChainId,
        address vault,
        string memory destTokenAddress,
        string memory destTokenService,
        uint256 min,
        uint256 max
    ) external virtual onlyOwner {
        _addToken(tokenAddress, _destChainId, vault, destTokenAddress, destTokenService, min, max);
    }

    function removeToken(
        address tokenAddress,
        uint256 _destChainId
    ) external onlyOwner {
        require(
            isSupportedToken(tokenAddress),
            "Token not supported"
        );
        require(_destChainId == destChainId, "Target Chain Mismatch");
        emit TokenRemoved(tokenAddress, _destChainId);
        delete supportedTokens[tokenAddress];
    }

    function enable(
        address tokenAddress,
        uint256 _destChainId
    ) external onlyOwner {
        require(
            !isEnabledToken(tokenAddress),
            "Token not enabled"
        );
        require(_destChainId == destChainId, "Target Chain Mismatch");
        supportedTokens[tokenAddress].enabled = true;
        emit TokenEnabled(tokenAddress, _destChainId);
    }

    function disable(
        address tokenAddress,
        uint256 _destChainId
    ) external onlyOwner {
        require(isEnabledToken(tokenAddress), "Token not enabled");
        require(_destChainId == destChainId, "Target Chain Mismatch");
        supportedTokens[tokenAddress].enabled = false;
        emit TokenDisabled(tokenAddress, _destChainId);
    }

    function updateMinValue(address tokenAddress, uint256 minValue) external onlyOwner {
        require(isSupportedToken(tokenAddress), "Token not supported");
        emit TokenMinValueUpdated(tokenAddress, destChainId, supportedTokens[tokenAddress].minValue, minValue);
        supportedTokens[tokenAddress].minValue = minValue;
    }

    function updateMaxValue(address tokenAddress, uint256 maxValue) external onlyOwner {
        require(isSupportedToken(tokenAddress), "Token not supported");
        emit TokenMaxValueUpdated(tokenAddress, destChainId, supportedTokens[tokenAddress].maxValue, maxValue);
        supportedTokens[tokenAddress].maxValue = maxValue;
    }
}
