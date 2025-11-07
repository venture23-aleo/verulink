// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {TokenServicePaxos} from "../contracts/main/paxosproxy/TokenServicePaxos.sol";
import {PredicateService} from "../contracts/main/tokenservice/predicate/PredicateService.sol";

contract SetPredicateServiceScript is Script {
    address constant TOKEN_SERVICE_PAXOS = 0x35c540E8081d2dBa0229Eaf8c8D5CC9Cc11B003D;
    address constant PREDICATE_SERVICE = 0xf3235882bA91086C2E2d05953b91df23Efe68d6e;

    function run() external {
        vm.startBroadcast();

        TokenServicePaxos ts = TokenServicePaxos(payable(TOKEN_SERVICE_PAXOS));

        console.log("Setting PredicateService...");
        ts.setPredicateService(PredicateService(PREDICATE_SERVICE));

        vm.stopBroadcast();

        console.log("PredicateService set");
    }
}
