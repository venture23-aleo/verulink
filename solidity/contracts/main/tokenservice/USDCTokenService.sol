// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {ERC20TokenService} from "./ERC20TokenService.sol";
import {HiYieldAdapter} from "./HiYieldAdapter.sol";

contract USDCTokenService is ERC20TokenService, HiYieldAdapter {

    function initialize(address _bridge, 
        uint256 _selfChainId, 
        address _usdc, 
        address _usdt,
        address _owner,
        uint256 _destChainId,
        string memory _destTokenAddress,
        string memory _destTokenService,
        uint256 _min,
        uint256 _max
    ) public {
        _addToken(_usdc, _destChainId, _destTokenAddress, _destTokenService, _min, _max);
        HiYieldAdapter.initialize(_owner, _usdc);
        ERC20TokenService.initialize(_bridge, _selfChainId, _usdc, _usdt, _owner);
    }

    function addToken(
        address tokenAddress,
        uint256 destChainId,
        string memory destTokenAddress,
        string memory destTokenService,
        uint256 min,
        uint256 max
    ) public override onlyOwner onlyProxy {
        revert();
    }
}