// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external;
    function transfer(address recipient, uint256 amount) external;
    
    /* usdc function to check blacklist 
       IMP: IS NOT A STANDARD ERC20 FUNCTION
    */
    function isBlacklisted(address account) external view returns (bool);
    
    /* usdt function to check blacklist 
       IMP: IS NOT A STANDARD ERC20 FUNCTION
    */
    function getBlackListStatus(address _maker) external view returns (bool);
}