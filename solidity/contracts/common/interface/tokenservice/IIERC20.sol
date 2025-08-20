// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title IIERC20
/// @dev Interface extending the standard ERC20 interface with additional functions.
interface IIERC20 is IERC20 {

    /// @notice Increases the allowance granted to `spender` by the caller.
    /// @param spender The address that will spend the funds.
    /// @param addedValue The added amount to increase the allowance by.
    /// @return boolean indicating whether the operation succeeded.
   function increaseAllowance(address spender, uint256 addedValue) external returns (bool);

     /// @notice Decreases the allowance granted to `spender` by the caller.
    /// @param spender The address that will spend the funds.
    /// @param subtractedValue The subtracted amount to decrease the allowance by.
    /// @return boolean indicating whether the operation succeeded.
   function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool);

    /* USDC function to check blacklist 
       IMP: IS NOT A STANDARD ERC20 FUNCTION

       USDC Contract addresses:
       ETH Mainnet: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    */
    /// @notice Checks if an account is blacklisted.
    /// @dev This function is not part of the standard ERC20 interface.
    /// @param account The address to be checked.
    /// @return True if the account is blacklisted, false otherwise.
    function isBlacklisted(address account) external view returns (bool);
    
    /* USDT function to check blacklist 
       IMP: IS NOT A STANDARD ERC20 FUNCTION
       
       USDT Contract addresses:
       ETH Mainnet: 0xdAC17F958D2ee523a2206206994597C13D831ec7
    */
    /// @notice Checks the blacklisting status of an account.
    /// @dev This function is not part of the standard ERC20 interface.
    /// @param _maker The address to be checked.
    /// @return True if the account is blacklisted, false otherwise.
    function getBlackListStatus(address _maker) external view returns (bool);

   //  Arbitrum USDT Contract 
   function isBlocked(address _maker) external view returns (bool);

   /// @notice Mints new tokens and assigns them to the specified address.
   /// @param to The address to receive the minted tokens.
   /// @param amount The number of tokens to mint.
   /// @dev Ensure the contract supports this function before calling it.
   function mint(address to, uint256 amount) external;

   /// @notice Burns tokens from the specified address, reducing the total supply.
   /// @param from The address from which tokens will be burned.
   /// @param amount The number of tokens to burn.
   /// @dev Ensure the contract supports this function before calling it.
    function burnFrom(address from, uint256 amount) external;
}
