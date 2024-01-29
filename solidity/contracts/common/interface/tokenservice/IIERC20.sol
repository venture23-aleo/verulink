// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IIERC20 is IERC20 {
   function increaseAllowance(address spender, uint256 addedValue) external returns (bool);
   function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool);

    /* USDC function to check blacklist 
       IMP: IS NOT A STANDARD ERC20 FUNCTION

       USDC Contract addresses:
       ETH Mainnet: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    */
    function isBlacklisted(address account) external view returns (bool);
    
    /* USDT function to check blacklist 
       IMP: IS NOT A STANDARD ERC20 FUNCTION
       
       USDT Contract addresses:
       ETH Mainnet: 0xdAC17F958D2ee523a2206206994597C13D831ec7
    */
    function getBlackListStatus(address _maker) external view returns (bool);
}
