// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
abstract contract Pausable is PausableUpgradeable, OwnableUpgradeable {

  // function Pausable_init() public initializer {
  //   __Ownable_init_unchained();
  //   __Pausable_init_unchained();
  // }
  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() virtual onlyOwner whenNotPaused public {
    _pause();
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() virtual onlyOwner whenPaused public {
    _unpause();
  }

  /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}