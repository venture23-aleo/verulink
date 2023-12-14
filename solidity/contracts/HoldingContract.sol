// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "./common/Ownable.sol";
import {IERC20} from "./common/interface/tokenservice/IERC20.sol";

contract Holding is Ownable {
    // user address => token address => amount
    mapping(address => mapping(address => uint256)) locked;

    mapping(address => mapping(address => uint256)) unlocked;

    address public tokenService;

    constructor(address _owner, address _tokenService) {
        owner = _owner;
        tokenService = _tokenService;
    }

    function updateTokenService(address _tokenService) public onlyOwner {
        tokenService = _tokenService;
    }

    function lock(address user, address token, uint256 amount) public {
        require(msg.sender == tokenService, "Caller is not registered Token Service");
        locked[user][token] += amount;
    }

    function unlock(address user, address token, uint256 amount) public onlyOwner {
        require(locked[user][token] >= amount, "Insufficient amount");
        locked[user][token] -= amount;
        unlocked[user][token] += amount;
    }

    function release(address user, address token, uint256 amount) public {
        require(unlocked[user][token] >= amount, "Insufficient amount");
        IERC20(token).transfer(user, amount);
    }
}