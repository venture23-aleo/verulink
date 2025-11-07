// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {TokenServicePaxos} from "../contracts/main/paxosproxy/TokenServicePaxos.sol";

contract EnableTokenScript is Script {
    address constant TOKEN_SERVICE_PAXOS = 0x35c540E8081d2dBa0229Eaf8c8D5CC9Cc11B003D;
    address constant ALEO_USD = 0x9fa87E2a02D6E187658ae232D3a3cAB38Fd638Ca;
    address constant VAULT = address(0);
    uint256 constant ALEO_CHAINID = 6694886634403;

    function run() external {
        vm.startBroadcast();

        TokenServicePaxos ts = TokenServicePaxos(payable(TOKEN_SERVICE_PAXOS));

        console.log("Adding aleoUSD...");
        ts.addToken(
            ALEO_USD,
            ALEO_CHAINID,
            VAULT,
            "11111111111field",
            "aleo1un3mnyu0yxf7mpragyxsv7y6ae9a6dhqgspq9lnx9nmp7n8u4ygqjr998k",
            1,
            100000000000
        );
        // ts.removeToken(ALEO_USD);
        vm.stopBroadcast();

        console.log("aleoUSD enabled!");
    }
}
