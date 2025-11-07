// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title TokenSupport
/// @dev Abstract contract providing support for managing tokens on a bridge
abstract contract TokenSupport is OwnableUpgradeable {

    /// @notice Emitted when the vault of a token is updated
    /// @param token address of token
    /// @param oldVault address of old vault
    /// @param newVault address of new vault
    event VaultUpdated(address token, address oldVault, address newVault);

    /// @notice Chain ID of the destination chain for token support
    uint256 public destChainId;

    /// @notice Immutable zero address
    address private immutable ZERO_ADDRESS = address(0);

    /// @notice Struct defining supported token information
    struct Token {
        address tokenAddress;
        address vault;
        string destTokenAddress;
        string destTokenService;
        uint256 minValue;
        uint256 maxValue;
        bool enabled;
    }

    /// @notice Mapping of token addresses to corresponding Token structs
    mapping(address => Token) public supportedTokens;

    /// @notice Emitted when a new token is added to the support list
    event TokenAdded(Token token, uint256 destChainId);

    /// @notice Emitted when a token is removed from the support list
    event TokenRemoved(address token, uint256 destChainId);

    /// @notice Emitted when a token is enabled for use
    event TokenEnabled(address token, uint256 destChainId);

    /// @notice Emitted when a token is disabled for use
    event TokenDisabled(address token, uint256 destChainId);

    /// @notice Emitted when the minimum value for a token is updated
    event TokenMinValueUpdated(address token, uint256 destChainId, uint256 oldMinValue, uint256 newMinValue);

    /// @notice Emitted when the maximum value for a token is updated
    event TokenMaxValueUpdated(address token, uint256 destChainId, uint256 oldMaxValue, uint256 newMaxValue);

    function __TokenSupport_init_unchained(uint256 _destChainId) internal {
        destChainId = _destChainId;
    }

    /// @notice Checks if a token is supported
    /// @param token The address of the token
    /// @return boolean indicating whether the token is supported
    function isSupportedToken(
        address token
    ) public virtual view returns (bool) {
        return
            address(supportedTokens[token].tokenAddress) != ZERO_ADDRESS;
    }

    /// @notice Checks if a token is enabled for use
    /// @param token The address of the token to check
    /// @return boolean indicating whether the token is enabled
    function isEnabledToken(
        address token
    ) public virtual view returns (bool) {
        return supportedTokens[token].enabled;
    }

    /// @notice Checks if the provided amount is within the supported range for a token
    /// @param tokenAddress The address of the token
    /// @param amount The amount to check
    /// @return boolean indicating whether the amount is within the supported range
    function isAmountInRange(address tokenAddress, uint256 amount) public virtual view returns (bool) {
        Token memory token = supportedTokens[tokenAddress];
        return amount >= token.minValue && amount <= token.maxValue;
    }

    /// @notice Adds a new token to the support list
    /// @param tokenAddress The address of the token
    /// @param _destChainId The destination chain ID for the token
    /// @param vault The address of the associated vault
    /// @param destTokenAddress The destination address on the remote chain
    /// @param destTokenService The destination token service on the remote chain
    /// @param min The minimum value for the token
    /// @param max The maximum value for the token
    function addToken(
        address tokenAddress,
        uint256 _destChainId,
        address vault,
        string memory destTokenAddress,
        string memory destTokenService,
        uint256 min, // 1
        uint256 max // million
    ) external virtual onlyOwner {
        require(tokenAddress != ZERO_ADDRESS, "TokenSupport: zero address");
        require(!isSupportedToken(tokenAddress),"TokenSupport: token already supported");
        require(_destChainId == destChainId, "TokenSupport: target chain mismatch");
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

    /// @notice Updates the vault address associated with a token, callable only by the owner
    /// @param token The address of the token
    /// @param _vault The new address of the vault
    function updateVault(address token, address _vault) external virtual onlyOwner {
        require(isSupportedToken(token), "TokenSupport: token not supported");
        address vault = supportedTokens[token].vault;
        emit VaultUpdated(token, vault, _vault);
        supportedTokens[token].vault = _vault;
    }

    /// @notice Removes a token from the support list, callable only by the owner
    /// @param tokenAddress The address of the token
    function removeToken(
        address tokenAddress
    ) external virtual onlyOwner {
        require(isSupportedToken(tokenAddress),"TokenSupport: token not supported");
        emit TokenRemoved(tokenAddress, destChainId);
        delete supportedTokens[tokenAddress];
    }

    /// @notice Enables a token for use, callable only by the owner
    /// @param tokenAddress The address of the token to enable
    function enable(
        address tokenAddress
    ) external virtual onlyOwner {
        require(isSupportedToken(tokenAddress),"TokenSupport: token not supported");
        require(!isEnabledToken(tokenAddress),"TokenSupport: token already enabled");
        supportedTokens[tokenAddress].enabled = true;
        emit TokenEnabled(tokenAddress, destChainId);
    }

    /// @notice Disables a token for use, callable only by the owner
    /// @param tokenAddress The address of the token to disable
    function disable(
        address tokenAddress
    ) external virtual onlyOwner {
        require(isSupportedToken(tokenAddress),"TokenSupport: token not supported");
        require(isEnabledToken(tokenAddress), "TokenSupport: token already disabled");
        supportedTokens[tokenAddress].enabled = false;
        emit TokenDisabled(tokenAddress, destChainId);
    }

    /// @notice Updates the minimum value for a token, callable only by the owner
    /// @param tokenAddress The address of the token
    /// @param minValue The new minimum value
    function updateMinValue(address tokenAddress, uint256 minValue) external virtual onlyOwner {
        require(isSupportedToken(tokenAddress), "TokenSupport: token not supported");
        emit TokenMinValueUpdated(tokenAddress, destChainId, supportedTokens[tokenAddress].minValue, minValue);
        supportedTokens[tokenAddress].minValue = minValue;
    }

    /// @notice Updates the maximum value for a token, callable only by the owner
    /// @param tokenAddress The address of the token
    /// @param maxValue The new maximum value
    function updateMaxValue(address tokenAddress, uint256 maxValue) external virtual onlyOwner {
        require(isSupportedToken(tokenAddress), "TokenSupport: token not supported");
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
