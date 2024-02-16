// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BridgeTokenServiceManager is OwnableUpgradeable {
    event TokenServiceAdded(address tokenService);
    event TokenServiceRemoved(address tokenService);

    mapping(address => bool) public tokenServices;

    function BridgeTokenServiceManager_init() public initializer {
        __Ownable_init();
    }

    function isRegisteredTokenService(address _service) public virtual view returns(bool) {
        return tokenServices[_service];
    }

    function addTokenService(address _service) external virtual onlyOwner {
        require(_service != address(0), "Zero Address");
        require(!isRegisteredTokenService(_service), "Token Service already exists");
        tokenServices[_service] = true;
        emit TokenServiceAdded(_service);
    }

    function removeTokenService(address _service) external virtual onlyOwner {
        require(isRegisteredTokenService(_service), "Unknown Token Service");
        delete tokenServices[_service];
        emit TokenServiceRemoved(_service);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}