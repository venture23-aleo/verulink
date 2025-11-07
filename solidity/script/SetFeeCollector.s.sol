// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Script, console} from "forge-std/Script.sol";
import {TokenServicePaxos} from "../contracts/main/paxosproxy/TokenServicePaxos.sol";
import {FeeCollector} from "../contracts/main/tokenservice/FeeCollector.sol";

contract SetFeeCollector is Script {
    address constant TOKEN_SERVICE_PAXOS = 0x35c540E8081d2dBa0229Eaf8c8D5CC9Cc11B003D;
    address constant FEE_COLLECTOR = 0x6142BfbdF9ceff271dAad912FE886EF59E2A69B7;

    function run() external {
        vm.startBroadcast();

        TokenServicePaxos tokenService = TokenServicePaxos(payable(TOKEN_SERVICE_PAXOS));
        FeeCollector feeCollector = FeeCollector(payable(FEE_COLLECTOR));

        console.log("Setting FeeCollector...");
        tokenService.setFeeCollector(feeCollector);

        vm.stopBroadcast();

        console.log("FeeCollector set:", address(feeCollector));
    }
}
