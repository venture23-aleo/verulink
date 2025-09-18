// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

interface ITellerWithMultiAssetSupport {
    function deposit(address depositAsset, uint256 depositAmount, uint256 minimumMint) external returns (uint256 shares);
    
    function bulkWithdraw(address withdrawAsset, uint256 shareAmount, uint256 minimumAssets, address to) external returns (uint256 assetsOut);

    function isSupported(address asset) external view returns (bool);
}