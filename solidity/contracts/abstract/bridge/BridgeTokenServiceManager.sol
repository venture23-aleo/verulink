// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import {Ownable} from "../../common/Ownable.sol";

contract BridgeTokenServiceManager is Ownable {
    event TokenServiceAdded(address tokenService);
    event TokenServiceRemoved(address tokenService);

    mapping(address => bool) internal tokenServices;

    function isRegisteredTokenService(address tokenService) public view returns(bool) {
        return tokenServices[tokenService];
    }

    function addTokenService(address tokenService) external onlyOwner {
        require(tokenService != address(0), "Zero Address");
        require(!isRegisteredTokenService(tokenService), "Token Service already exists");
        tokenServices[tokenService] = true;
        emit TokenServiceAdded(tokenService);
    }

    function removeTokenService(address tokenService) external onlyOwner {
        require(isRegisteredTokenService(tokenService), "Unknown Token Service");
        delete tokenServices[tokenService];
        emit TokenServiceRemoved(tokenService);
    }

    // address public tokenService;

    // function updateTokenService(address service) external {
    //     require(service != address(0), "Zero Address");
    //     tokenService = service;
    //     emit TokenServiceAdded(service);
    // }
}