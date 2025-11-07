// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Script, console} from "forge-std/Script.sol";
import {BridgeV2} from "../contracts/main/BridgeV2.sol";
import {ProxyContract} from "../contracts/proxies/Proxy.sol";

contract DeployBridgeV2 is Script {
    uint256 constant ALEO_CHAINID = 6694886634403;

    function run() external {
        vm.startBroadcast();

        address deployer = msg.sender;

        // Deploy BridgeV2 with libraries
        console.log("Deploying BridgeV2...");
        BridgeV2 bridgeImpl = new BridgeV2();
        console.log("BridgeV2 Implementation:", address(bridgeImpl));

        // Encode initialization data
        bytes memory initializeData = abi.encodeWithSignature("Bridge_init(uint256,address)", ALEO_CHAINID, deployer);

        // Deploy proxy
        console.log("Deploying Proxy...");
        ProxyContract proxy = new ProxyContract(address(bridgeImpl), initializeData);
        console.log("BridgeV2 Proxy:", address(proxy));

        vm.stopBroadcast();

        console.log("\nDeployment complete!");
        console.log("Bridge Implementation:", address(bridgeImpl));
        console.log("Bridge Proxy:", address(proxy));
    }
}
