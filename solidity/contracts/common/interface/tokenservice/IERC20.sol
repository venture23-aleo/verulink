// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    
    function approve(address spender, uint256 amount) external returns (bool);

    function balanceOf(address account) external view returns (uint256);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);

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
