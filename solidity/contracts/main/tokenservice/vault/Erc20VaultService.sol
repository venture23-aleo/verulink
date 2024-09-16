// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {IIERC20} from "../../../common/interface/tokenservice/IIERC20.sol";
import {VaultService} from "../../../base/tokenservice/VaultService.sol";
import {Upgradeable} from "@thirdweb-dev/contracts/extension/Upgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Erc20VaultService Contract
/// @dev This contract implements VaultService and Upgradeable contracts specifically for ERC20 tokens.
contract Erc20VaultService is VaultService, Upgradeable {

    using SafeERC20 for IIERC20;

    address private immutable ZERO_ADDRESS = address(0);
    address private immutable ETH_TOKEN = address(1);

    /// @dev Initializes the Erc20VaultService contract
    /// @param _token Address of the ERC20 token
    /// @param _name A descriptive name for the vault service
    function Erc20VaultService_init(
        address _token,
        string memory _name,
        address _owner
    ) public initializer {
        require(
            _token != ZERO_ADDRESS && _token != ETH_TOKEN,
            "Erc20VaultService: only erc20 address"
        );
        __VaultService_init(_token, _name, _owner);
    }

    /// @dev Authorizes an upgrade only if the caller is the owner
    function _authorizeUpgrade(address) internal view virtual override {
        require(msg.sender == owner());
    }

    /// @notice Transfers ERC20 tokens from the vault to the owner
    /// @param amount The amount of ERC20 tokens to be transferred
    /// @return true if the transfer is successful, false otherwise
    function transfer(
        uint256 amount
    ) external virtual onlyOwner returns (bool) {
        IIERC20(token).safeTransfer(owner(), amount);
        return true;
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
