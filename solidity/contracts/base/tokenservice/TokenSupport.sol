// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract TokenSupport is OwnableUpgradeable {

    event VaultUpdated(address token, address oldVault, address newVault);

    uint256 public destChainId;
    address private immutable ZERO_ADDRESS = address(0);

    struct Token {
        address tokenAddress;
        address vault;
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

    function TokenSupport_init(uint256 _destChainId) public initializer {
        __Ownable_init_unchained();
        __TokenSupport_init_unchained(_destChainId);
    }

    function __TokenSupport_init_unchained(uint256 _destChainId) internal onlyInitializing {
        destChainId = _destChainId;
    }

    function isSupportedToken(
        address token
    ) public virtual view returns (bool) {
        return
            address(supportedTokens[token].tokenAddress) != ZERO_ADDRESS;
    }

    function isEnabledToken(
        address token
    ) public virtual view returns (bool) {
        return supportedTokens[token].enabled;
    }

    function isAmountInRange(address tokenAddress, uint256 amount) public virtual view returns (bool) {
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
        require(tokenAddress != ZERO_ADDRESS, "Zero Address");
        require(!isSupportedToken(tokenAddress),"Token already supported");
        require(_destChainId == destChainId, "Target Chain Mismatch");
        Token memory token = Token(
            tokenAddress,
            vault,
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

    function updateVault(address token, address _vault) external virtual onlyOwner {
        address vault = address(supportedTokens[token].vault);
        emit VaultUpdated(token, vault, _vault);
        supportedTokens[token].vault = _vault;
    }

    function removeToken(
        address tokenAddress,
        uint256 _destChainId
    ) external virtual onlyOwner {
        require(isSupportedToken(tokenAddress),"Token not supported");
        require(_destChainId == destChainId, "Target Chain Mismatch");
        emit TokenRemoved(tokenAddress, _destChainId);
        delete supportedTokens[tokenAddress];
    }

    function enable(
        address tokenAddress,
        uint256 _destChainId
    ) external virtual onlyOwner {
        // require(tokenAddress != ZERO_ADDRESS, "Zero Address");
        require(isSupportedToken(tokenAddress),"Token not supported");
        require(!isEnabledToken(tokenAddress),"Token already enabled");
        require(_destChainId == destChainId, "Target Chain Mismatch");
        supportedTokens[tokenAddress].enabled = true;
        emit TokenEnabled(tokenAddress, _destChainId);
    }

    function disable(
        address tokenAddress,
        uint256 _destChainId
    ) external virtual onlyOwner {
        require(isSupportedToken(tokenAddress),"Token not supported");
        require(isEnabledToken(tokenAddress), "Token already disabled");
        require(_destChainId == destChainId, "Target Chain Mismatch");
        supportedTokens[tokenAddress].enabled = false;
        emit TokenDisabled(tokenAddress, _destChainId);
    }

    function updateMinValue(address tokenAddress, uint256 minValue) external virtual onlyOwner {
        require(isSupportedToken(tokenAddress), "Token not supported");
        emit TokenMinValueUpdated(tokenAddress, destChainId, supportedTokens[tokenAddress].minValue, minValue);
        supportedTokens[tokenAddress].minValue = minValue;
    }

    function updateMaxValue(address tokenAddress, uint256 maxValue) external virtual onlyOwner {
        require(isSupportedToken(tokenAddress), "Token not supported");
        emit TokenMaxValueUpdated(tokenAddress, destChainId, supportedTokens[tokenAddress].maxValue, maxValue);
        supportedTokens[tokenAddress].maxValue = maxValue;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
