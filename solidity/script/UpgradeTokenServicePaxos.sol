// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {TokenServicePaxos} from "../contracts/main/paxosproxy/TokenServicePaxos.sol";

interface IUpgradeableProxy {
    function upgradeTo(address newImplementation) external;
    function upgradeToAndCall(address newImplementation, bytes calldata data) external payable;
}

contract UpgradeTokenServicePaxos is Script {
    address constant PROXY = 0x60719Bfb63d36E09bdc8478f1378BF6e886FBde1;

    function run() public {
        vm.startBroadcast();

        TokenServicePaxos newImpl = new TokenServicePaxos();
        console.log("New Implementation:", address(newImpl));

        IUpgradeableProxy(PROXY).upgradeTo(address(newImpl));
        console.log("Proxy Upgraded:", PROXY);

        vm.stopBroadcast();
    }
}
