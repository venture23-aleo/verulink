// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import {Ownable} from "../../common/Ownable.sol";

contract BridgeTokenServiceManager is Ownable {
    event TokenServiceAdded(address tokenService, uint256 destChainId);
    event TokenServiceRemoved(address tokenService, uint256 destChainId);

    mapping(address => mapping(uint256 => bool)) internal tokenServices;

    function isRegisteredTokenService(address tokenService, uint256 destChainId) public view returns(bool) {
        return tokenServices[tokenService][destChainId];
    }

    function addTokenService(address tokenService, uint256 destChainId) external onlyOwner {
        require(tokenService != address(0), "Zero Address");
        require(!isRegisteredTokenService(tokenService, destChainId), "Token Service already exists");
        tokenServices[tokenService][destChainId] = true;
        emit TokenServiceAdded(tokenService, destChainId);
    }

    function removeTokenService(address tokenService, uint256 destChainId) external onlyOwner {
        require(isRegisteredTokenService(tokenService, destChainId), "Unknown Token Service");
        delete tokenServices[tokenService][destChainId];
        emit TokenServiceRemoved(tokenService, destChainId);
    }

    // address public tokenService;

    // function updateTokenService(address service) external {
    //     require(service != address(0), "Zero Address");
    //     tokenService = service;
    //     emit TokenServiceAdded(service);
    // }
}