// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IERC20} from "../../common/Interface/tokenservice/IERC20.sol";
import {Ownable} from "../../common/Ownable.sol";
import "@thirdweb-dev/contracts/extension/Initializable.sol";

abstract contract BlackListService is Ownable, Initializable {
    event BlackListAdded(address account);
    event BlackListRemoved(address account);

    mapping(address => bool) blackLists;

    address internal usdc;
    address internal usdt;

    function initialize(address _usdc, address _usdt) internal initializer {
        usdc = _usdc;
        usdt = _usdt;
    }

    function addToBlackList(address account) external onlyOwner {
        emit BlackListAdded(account);
        blackLists[account] = true;
    }
    function removeFromBlackList(address account) external onlyOwner {
        emit BlackListRemoved(account);
        delete blackLists[account];
    }
    function isBlackListed(address account) public view returns (bool) {
        return (blackLists[account] || 
            IERC20(usdc).isBlacklisted(account) ||
            IERC20(usdt).getBlackListStatus(account));
    }
}