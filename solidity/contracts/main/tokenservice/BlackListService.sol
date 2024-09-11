// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {IBlackListService} from "../../common/interface/tokenservice/IBlackListService.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";

/// @title BlackListService Contract
/// @dev This contract implements IBlackListService, OwnableUpgradeable, and Upgradeable contracts.
contract BlackListService is IBlackListService, OwnableUpgradeable, Upgradeable {

    /// @notice Event triggered when an account is added to the blacklist
    /// @param account The address of the account being added to the blacklist
    event BlackListAdded(address account);

    /// @notice Event triggered when an account is removed from the blacklist
    /// @param account The address of the account being removed from the blacklist
    event BlackListRemoved(address account);

    mapping(address => bool) private blackLists;

    /*
    USDC Contract addresses:
    ETH Mainnet: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    */
     /// @dev Address of the USDC contract
    address internal usdc;

    /*
    USDT Contract addresses:
    ETH Mainnet: 0xdAC17F958D2ee523a2206206994597C13D831ec7
    */
    /// @dev Address of the USDT contract
    address internal usdt;

    /// @dev Initializes the BlackListService contract
    /// @param _usdc Address of the USDC contract
    /// @param _usdt Address of the USDT contract
    function BlackList_init(address _usdc, address _usdt, address _owner) public virtual initializer {
        __Ownable_init();
        _transferOwnership(_owner);
        usdc = _usdc;
        usdt = _usdt;
    }

    /// @dev Authorizes an upgrade only if the caller is the owner
    function _authorizeUpgrade(address) internal virtual view override {
        require(msg.sender == owner());
    }

    /// @notice Adds an account to the blacklist
    /// @param account The address of the account to be added to the blacklist
    function addToBlackList(address account) external virtual onlyOwner {
        emit BlackListAdded(account);
        blackLists[account] = true;
    }

    /// @notice Removes an account from the blacklist
    /// @param account The address of the account to be removed from the blacklist
    function removeFromBlackList(address account) external virtual onlyOwner {
        emit BlackListRemoved(account);
        delete blackLists[account];
    }

    /// @notice Checks if an account is blacklisted
    /// @param account The address of the account to check
    /// @return true if the account is blacklisted, false otherwise
    function isBlackListed(address account) public virtual view override returns (bool) {
        return (blackLists[account] || 
            IIERC20(usdc).isBlacklisted(account) ||
            IIERC20(usdt).getBlackListStatus(account)
        );
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}