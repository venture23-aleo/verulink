// ERC20TokenSupport
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {TokenSupport} from "../../base/tokenservice/TokenSupport.sol";
import {OwnableMock} from "../common/OwnableMock.sol";

contract ERC20TokenSupportMock is TokenSupport, OwnableMock {}
