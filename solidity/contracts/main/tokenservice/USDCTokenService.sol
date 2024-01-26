// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {ERC20TokenService} from "./ERC20TokenService.sol";
import {HiYieldAdapter} from "../../base/tokenservice/hiyield/HiYieldAdapter.sol";

contract USDCTokenService is ERC20TokenService, HiYieldAdapter {

    function initialize(address _bridge, 
        uint256 _selfChainId,
        address _owner,
        address _blackListService,
        address _usdc,
        uint256 _destChainId,
        string memory _destTokenAddress,
        string memory _destTokenService,
        uint256 _min,
        uint256 _max
    ) public {
        _addToken(_usdc, _destChainId, _destTokenAddress, _destTokenService, _min, _max);
        HiYieldAdapter._initialize(_owner, _usdc);
        ERC20TokenService.initialize(_bridge, _selfChainId, _owner, _blackListService);
    }

    function addToken(
        address,
        uint256,
        string memory,
        string memory,
        uint256,
        uint256
    ) public override pure {
        revert();
    }
}