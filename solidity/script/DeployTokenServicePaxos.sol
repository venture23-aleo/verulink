// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Script, console} from "forge-std/Script.sol";
import {TokenServicePaxos} from "../contracts/main/paxosproxy/TokenServicePaxos.sol";
import {ProxyContract} from "../contracts/proxies/Proxy.sol";

contract DeployTokenServicePaxos is Script {
    uint256 constant ETH_CHAINID = 28556963657430695;
    uint256 constant ALEO_CHAINID = 6694886634403;

    address constant teller = 0x74066bF569FC0077072ff4c08A83f790dfF3F254;
    address constant bridge = 0x54d1540631cACfa5f8d9b3371B88f562355387fA;
    address constant blackListService = 0x159eD5F121eA0dBB28bFf5226f9687abA246A5a3;
    address constant aleoUSD = 0x9fa87E2a02D6E187658ae232D3a3cAB38Fd638Ca;

    function run() external {
        vm.startBroadcast();
        address deployer = msg.sender;

        console.log("Deploying TokenServicePaxos implementation...");
        TokenServicePaxos tokenServiceImpl = new TokenServicePaxos();

        bytes memory initializeData = abi.encodeWithSignature(
            "TokenServicePaxos_init(address,address,uint256,uint256,address,address,address)",
            bridge,
            deployer,
            ETH_CHAINID,
            ALEO_CHAINID,
            blackListService,
            teller,
            aleoUSD
        );

        console.log("Deploying TokenServicePaxos proxy...");
        ProxyContract proxy = new ProxyContract(address(tokenServiceImpl), initializeData);

        vm.stopBroadcast();

        console.log("TokenServicePaxos Implementation:", address(tokenServiceImpl));
        console.log("TokenServicePaxos Proxy:", address(proxy));
    }
}
