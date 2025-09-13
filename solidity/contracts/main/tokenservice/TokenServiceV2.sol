// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IIERC20} from "../../common/interface/tokenservice/IIERC20.sol";
import {TokenService} from "../../main/tokenservice/TokenService.sol";
import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
import {PredicateService} from "../../main/tokenservice/predicate/PredicateService.sol";

/// @title TokenServiceV2 Contract
/// @dev Inherits TokenService and PredicateService for predicate-based authorization
contract TokenServiceV2 is TokenService {
    using SafeERC20 for IIERC20;

    /// @notice Sets the VerulinkPredicate contract for predicate-based authorization, callable by owner only
    /// @param _predicateservice Address of the VerulinkPredicate contract
    function setPredicateService(
        PredicateService _predicateservice
    ) external virtual onlyOwner {
        predicateservice = _predicateservice;
    }

    receive() external payable virtual override onlyWhitelistedSender {}
    
    function addWhitelistAddress(address _addr) external virtual onlyOwner {
        if (!isWhitelistedSender[_addr]){
            isWhitelistedSender[_addr] = true;
        }
    }

    function removeWhitelistAddress(address _addr) external virtual onlyOwner {
        if (isWhitelistedSender[_addr]){
            delete isWhitelistedSender[_addr];
        }
    }

    modifier onlyWhitelistedSender() {
        require(isWhitelistedSender[msg.sender] || msg.sender == owner(), "TokenService: SenderIsNotWhitelisted");
        _;
    }

    /**
     * @dev Reserved storage for future upgrades
     */
    uint256[49] private __gap;

    PredicateService public predicateservice;
    bool public isPredicateEnabled;
    mapping (address => bool) public isWhitelistedSender;
}
