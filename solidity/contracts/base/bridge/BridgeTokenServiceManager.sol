// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title BridgeTokenServiceManager Contract
/// @dev This contract manages the registration and removal of Token Services for the bridge.
abstract contract BridgeTokenServiceManager is OwnableUpgradeable {

    /// @dev Event triggered when a new Token Service is added
    /// @param tokenService The address of the added Token Service
    event TokenServiceAdded(address tokenService);

    /// @dev Event triggered when a Token Service is removed
    /// @param tokenService The address of the removed Token Service
    event TokenServiceRemoved(address tokenService);

    /// @dev Mapping to track registered Token Services
    mapping(address => bool) public tokenServices;

    // function BridgeTokenServiceManager_init() public initializer {
    //     __Ownable_init();
    // }

    /// @notice Checks if a Token Service is registered
    /// @param _service The address of the Token Service to check
    /// @return true if the Token Service is registered, false otherwise
    function isRegisteredTokenService(address _service) public virtual view returns(bool) {
        return tokenServices[_service];
    }

    /// @notice Adds a new Token Service to the list of registered services
    /// @param _service The address of the new Token Service
    function addTokenService(address _service) external virtual onlyOwner {
        require(_service != address(0), "BridgeTokenServiceManager: zero address");
        require(!isRegisteredTokenService(_service), "BridgeTokenServiceManager: token service already exists");
        tokenServices[_service] = true;
        emit TokenServiceAdded(_service);
    }

    /// @notice Removes a Token Service from the list of registered services
    /// @param _service The address of the Token Service to be removed
    function removeTokenService(address _service) external virtual onlyOwner {
        require(isRegisteredTokenService(_service), "BridgeTokenServiceManager: unknown token service");
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