// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDTMock is ERC20 {
    mapping(address => bool) blackLists;

    constructor() ERC20("USDT", "USDT") {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function getBlackListStatus(address account) public view returns (bool) {
        return blackLists[account];
    }

    function addBlackList(address account) external {
        blackLists[account] = true;
    }

    function removeBlackList(address account) external {
        delete blackLists[account];
    }
}