// ERC20TokenSupport
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {ERC20TokenSupport} from "../../base/tokenservice/ERC20TokenSupport.sol";
import {OwnableMock} from "../common/OwnableMock.sol";

contract ERC20TokenSupportMock is ERC20TokenSupport, OwnableMock {}
