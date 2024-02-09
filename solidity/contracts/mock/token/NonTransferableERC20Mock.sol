// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Pausable} from "../../common/Pausable.sol";


contract NonTransferableERC20Mock is ERC20, Pausable {

    constructor() ERC20("NonTransferable", "NON") {}
    
    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function transfer(address to, uint256 value) public override returns (bool) {
        return false;
    }

    function transferFrom (address sender, address to, uint256 value) public override returns (bool) {
        return false;
    }
}