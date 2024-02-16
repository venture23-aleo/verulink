// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {IBlackListService} from "../../common/interface/tokenservice/IBlackListService.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";

contract BlackListService is IBlackListService, OwnableUpgradeable, Upgradeable {
    event BlackListAdded(address account);
    event BlackListRemoved(address account);

    mapping(address => bool) private blackLists;

    /*
    USDC Contract addresses:
    ETH Mainnet: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    */
    address internal usdc;

    /*
    USDT Contract addresses:
    ETH Mainnet: 0xdAC17F958D2ee523a2206206994597C13D831ec7
    */
    address internal usdt;

    function BlackList_init(address _usdc, address _usdt) public virtual initializer {
        __Ownable_init();
        usdc = _usdc;
        usdt = _usdt;
    }

    function _authorizeUpgrade(address) internal virtual view override {
        require(msg.sender == owner());
    }

    function addToBlackList(address account) external virtual onlyOwner {
        emit BlackListAdded(account);
        blackLists[account] = true;
    }

    function removeFromBlackList(address account) external virtual onlyOwner {
        emit BlackListRemoved(account);
        delete blackLists[account];
    }

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