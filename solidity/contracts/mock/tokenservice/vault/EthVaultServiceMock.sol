// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {EthVaultService} from "../../../main/tokenservice/vault/EthVaultService.sol";

contract EthVaultServiceMock is EthVaultService {
    fallback() external payable {
    }
}
