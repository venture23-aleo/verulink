// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {IBlackListService} from "../../common/interface/tokenservice/IBlackListService.sol";
import {Ownable} from "../../common/Ownable.sol";
import {Initializable} from "@thirdweb-dev/contracts/extension/Initializable.sol";

contract BlackListService is Ownable, IBlackListService, Initializable {
    event BlackListAdded(address account);
    event BlackListRemoved(address account);

    mapping(address => bool) blackLists;

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

    function initialize(address _owner, address _usdc, address _usdt) public initializer{
        super._initialize(_owner);
        usdc = _usdc;
        usdt = _usdt;
    }

    function addToBlackList(address account) external onlyOwner onlyProxy {
        emit BlackListAdded(account);
        blackLists[account] = true;
    }

    function removeFromBlackList(address account) external onlyOwner onlyProxy {
        emit BlackListRemoved(account);
        delete blackLists[account];
    }

    function isBlackListed(address account) public view override onlyProxy returns (bool) {
        return (blackLists[account] || 
            IIERC20(usdc).isBlacklisted(account) ||
            IIERC20(usdt).getBlackListStatus(account)
        );
    }
}