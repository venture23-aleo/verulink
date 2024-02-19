// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Pausable} from "../../common/Pausable.sol";

/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
contract PausableMock is Pausable {
  function Pausable_init() public initializer {
    __Ownable_init_unchained();
    __Pausable_init_unchained();
  }
}