// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import {Script, console} from "forge-std/Script.sol";
import {BlackListService} from "../contracts/main/tokenservice/BlackListServiceFix.sol";
import {ProxyContract} from "../contracts/proxies/Proxy.sol";

contract DeployBlackListService is Script {
    address constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;
    address constant USDT = 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06;

    function run() external {
        vm.startBroadcast();

        address deployer = msg.sender;

        console.log("Deploying BlackListService implementation...");
        BlackListService blackListImpl = new BlackListService();

        bytes memory initializeData =
            abi.encodeWithSignature("BlackList_init(address,address,address)", USDC, USDT, deployer);

        console.log("Deploying BlackListService proxy...");
        ProxyContract proxy = new ProxyContract(address(blackListImpl), initializeData);

        vm.stopBroadcast();

        console.log("BlackListService Implementation:", address(blackListImpl));
        console.log("BlackListService Proxy:", address(proxy));
    }
}
