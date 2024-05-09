// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {VaultService} from "../../../base/tokenservice/VaultService.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";

/// @title EthVaultService Contract
/// @dev This contract implements VaultService and Upgradeable contracts specifically for Ether (ETH).
contract EthVaultService is VaultService, Upgradeable {

    /// @notice address of ETH
    address private immutable ETH_TOKEN = address(1);

    receive() external payable {
    }

    /// @dev Initializes the EthVaultService contract
    /// @param _name A descriptive name for the vault service
    function EthVaultService_init(
        string memory _name,
        address _owner
    ) public initializer {
        __VaultService_init(ETH_TOKEN, _name, _owner);
    }

    /// @dev Authorizes an upgrade only if the caller is the owner
    function _authorizeUpgrade(address) internal virtual view override {
        require(msg.sender == owner());
    }


    /// @notice Transfers Ether from the vault to the owner
    /// @param amount The amount of Ether to be transferred
    /// @return true if the transfer is successful, false otherwise
    function transfer(uint256 amount) external virtual onlyOwner returns (bool) {
        (bool sent,) = owner().call{value: amount}("");
        require(sent, "EthVaultService: eth approval failed");
        return true;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}