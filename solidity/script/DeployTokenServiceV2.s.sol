// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Script, console} from "forge-std/Script.sol";
import {TokenServiceV2} from "../contracts/main/tokenservice/TokenServiceV2.sol";
import {ProxyContract} from "../contracts/proxies/Proxy.sol";

contract DeployTokenServiceV2 is Script {
    uint256 constant ETH_CHAINID = 28556963657430695;
    uint256 constant ALEO_CHAINID = 6694886634403;

    function run() external {
        vm.startBroadcast();

        address deployer = msg.sender;
        address bridge = 0xBf0bfE16846e76486c2caeDb4B077eD0aDCed44F;
        address blackListService = vm.envAddress("BLACKLIST_SERVICE");

        console.log("Deploying TokenServiceV2 implementation...");
        TokenServiceV2 tokenServiceImpl = new TokenServiceV2();

        bytes memory initializeData = abi.encodeWithSignature(
            "TokenService_init(address,address,uint256,uint256,address)",
            bridge,
            deployer,
            ETH_CHAINID,
            ALEO_CHAINID,
            blackListService
        );

        console.log("Deploying TokenServiceV2 proxy...");
        ProxyContract proxy = new ProxyContract(address(tokenServiceImpl), initializeData);

        vm.stopBroadcast();

        console.log("TokenServiceV2 Implementation:", address(tokenServiceImpl));
        console.log("TokenServiceV2 Proxy:", address(proxy));
    }
}
