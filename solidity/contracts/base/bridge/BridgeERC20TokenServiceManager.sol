// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;
import {Ownable} from "../../common/Ownable.sol";

contract BridgeERC20TokenServiceManager is Ownable {
    event TokenServiceAdded(address tokenService);
    event TokenServiceRemoved(address tokenService);

    address public tokenService;

    function isRegisteredTokenService(address _tokenService) public view returns(bool) {
        return _tokenService == tokenService;
    }

    function updateTokenService(address _tokenService) external onlyOwner {
        require(_tokenService != address(0), "Zero Address");
        require(!isRegisteredTokenService(_tokenService), "Token Service already exists");
        tokenService = _tokenService;
        emit TokenServiceAdded(_tokenService);
    }

    function removeTokenService(address _tokenService) external onlyOwner {
        require(isRegisteredTokenService(_tokenService), "Unknown Token Service");
        tokenService = address(0);
        emit TokenServiceRemoved(_tokenService);
    }

    // address public tokenService;

    // function updateTokenService(address service) external {
    //     require(service != address(0), "Zero Address");
    //     tokenService = service;
    //     emit TokenServiceAdded(service);
    // }
}