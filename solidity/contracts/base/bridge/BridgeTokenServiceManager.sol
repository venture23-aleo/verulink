// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Ownable} from "../../common/Ownable.sol";

abstract contract BridgeTokenServiceManager is Ownable {
    event TokenServiceAdded(address tokenService);
    event TokenServiceRemoved(address tokenService);

    mapping(address => bool) tokenServices;

    function isRegisteredTokenService(address _service) public view onlyProxy returns(bool) {
        return tokenServices[_service];
    }

    function addTokenService(address _service) external onlyOwner onlyProxy {
        require(_service != address(0), "Zero Address");
        require(!isRegisteredTokenService(_service), "Token Service already exists");
        tokenServices[_service] = true;
        emit TokenServiceAdded(_service);
    }

    function removeTokenService(address _service) external onlyOwner onlyProxy {
        require(isRegisteredTokenService(_service), "Unknown Token Service");
        delete tokenServices[_service];
        emit TokenServiceRemoved(_service);
    }
}