// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Script, console} from "forge-std/Script.sol";
import {Holding} from "../contracts/main/Holding.sol";
import {ProxyContract} from "../contracts/proxies/Proxy.sol";

contract DeployHolding is Script {
    function run() external {
        vm.startBroadcast();

        address deployer = msg.sender;
        address tokenService = vm.envAddress("TOKEN_SERVICE"); // Set via env or update here

        console.log("Deploying Holding implementation...");
        Holding holdingImpl = new Holding();

        bytes memory initializeData = abi.encodeWithSignature("Holding_init(address,address)", tokenService, deployer);

        console.log("Deploying Holding proxy...");
        ProxyContract proxy = new ProxyContract(address(holdingImpl), initializeData);

        vm.stopBroadcast();

        console.log("Holding Implementation:", address(holdingImpl));
        console.log("Holding Proxy:", address(proxy));
    }
}
