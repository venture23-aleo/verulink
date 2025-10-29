// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface ITellerWithMultiAssetSupport {
    function owner() external view returns (address);
    function vault() external view returns (address);
    function authority() external view returns(address);
    function deposit(address depositAsset, uint256 depositAmount, uint256 minimumMint) external returns (uint256 shares);

    function bulkWithdraw(address withdrawAsset, uint256 shareAmount, uint256 minimumAssets, address to)
        external
        returns (uint256 assetsOut);

    function isSupported(address asset) external view returns (bool);
    function addAsset(ERC20 asset) external;
}
