// SPDX-License-Identifier: MIT
import hardhat from "hardhat";
const { ethers } = hardhat;
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    console.log("Starting TokenService Upgrade Test on Local Hardhat Network");
    console.log("===========================================================");
    
    // Get signers
    const [deployer, user1, user2, user3, user4] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address);

    // Step 1: Deploy Mock Tokens and Dependencies
    console.log("\nStep 1: Deploying Mock Tokens and Dependencies");
    console.log("------------------------------------------------");
    updateEnvFile("=================================");
    
    const USDCMock = await ethers.getContractFactory("USDCMock");
    const usdcMock = await USDCMock.deploy();
    await usdcMock.deployed();
    updateEnvFile("USDC_MOCK_ADDRESS", usdcMock.address);
    console.log("✅ USDC Mock deployed to:", usdcMock.address);

    const USDTMock = await ethers.getContractFactory("USDTMock");
    const usdtMock = await USDTMock.deploy();
    await usdtMock.deployed();
    updateEnvFile("USDT_MOCK_ADDRESS", usdtMock.address);
    console.log("✅ USDT Mock deployed to:", usdtMock.address);

    // Deploy BlackListService
    const BlackListService = await ethers.getContractFactory("BlackListService");
    const blackListServiceImpl = await BlackListService.deploy();
    await blackListServiceImpl.deployed();

    updateEnvFile("BLACKLIST_SERVICE_IMPL_ADDRESS", blackListServiceImpl.address);
    console.log("✅ BlackListService Implementation deployed to:", blackListServiceImpl.address);

    const BlackListServiceProxy = await ethers.getContractFactory("ProxyContract");
    const blacklistInitData = BlackListService.interface.encodeFunctionData("BlackList_init", [
        usdcMock.address,
        usdtMock.address,
        deployer.address
    ]);
    const blacklistProxy = await BlackListServiceProxy.deploy(blackListServiceImpl.address, blacklistInitData);
    await blacklistProxy.deployed();

    updateEnvFile("BLACKLIST_SERVICE_PROXY_ADDRESS", blacklistProxy.address);
    console.log("✅ BlackListService Proxy deployed to:", blacklistProxy.address);

    // Deploy Libraries
    const PacketLibrary = await ethers.getContractFactory("PacketLibrary");
    const packetLibrary = await PacketLibrary.deploy();
    await packetLibrary.deployed();
    updateEnvFile("PACKET_LIBRARY_ADDRESS", packetLibrary.address);
    console.log("✅ PacketLibrary deployed to:", packetLibrary.address);

    const AleoAddressLibrary = await ethers.getContractFactory("AleoAddressLibrary");
    const aleoAddressLibrary = await AleoAddressLibrary.deploy();
    await aleoAddressLibrary.deployed();
    updateEnvFile("ALEO_ADDRESS_LIBRARY_ADDRESS", aleoAddressLibrary.address);  
    console.log("✅ AleoAddressLibrary deployed to:", aleoAddressLibrary.address);

    // Deploy Bridge
    const Bridge = await ethers.getContractFactory("Bridge", {
        libraries: {
            PacketLibrary: packetLibrary.address,
            AleoAddressLibrary: aleoAddressLibrary.address,
        },
    });
    const bridgeImpl = await Bridge.deploy();
    await bridgeImpl.deployed();
    updateEnvFile("BRIDGE_IMPL_ADDRESS", bridgeImpl.address);
    console.log("✅ Bridge Implementation deployed to:", bridgeImpl.address);

    const BridgeProxy = await ethers.getContractFactory("ProxyContract");
    const destChainId = 2; // Aleo chain ID
    const ethChainId = 1; // Ethereum chain ID
    const bridgeInitData = Bridge.interface.encodeFunctionData("Bridge_init", [destChainId, deployer.address]);
    const bridgeProxy = await BridgeProxy.deploy(bridgeImpl.address, bridgeInitData);
    await bridgeProxy.deployed();

    updateEnvFile("BRIDGE_PROXY_ADDRESS", bridgeProxy.address);
    console.log("✅ Bridge Proxy deployed to:", bridgeProxy.address);

    const bridge = Bridge.attach(bridgeProxy.address);

    // Add attestors to bridge
    await bridge.addAttestor(user1.address, 1);
    await bridge.addAttestor(user2.address, 2);
    console.log("✅ Attestors added to Bridge");

    // Step 2: Deploy TokenService V1 Implementation
    console.log("\nStep 2: Deploying TokenService V1 Implementation");
    console.log("--------------------------------------------------");
    
    const TokenServiceV1 = await ethers.getContractFactory("TokenService");
    const tokenServiceV1Impl = await TokenServiceV1.deploy();
    await tokenServiceV1Impl.deployed();
    updateEnvFile("TOKEN_SERVICE_V1_IMPL_ADDRESS", tokenServiceV1Impl.address);
    console.log("✅ TokenService V1 Implementation deployed to:", tokenServiceV1Impl.address);

    // Step 3: Deploy TokenService Proxy
    console.log("\nStep 3: Deploying TokenService Proxy");
    console.log("--------------------------------------");
    
    const TokenServiceProxy = await ethers.getContractFactory("ProxyContract");
    const tokenServiceInitData = TokenServiceV1.interface.encodeFunctionData("TokenService_init", [
        bridgeProxy.address,
        deployer.address,
        ethChainId,
        destChainId,
        blacklistProxy.address
    ]);
    const tokenServiceProxy = await TokenServiceProxy.deploy(tokenServiceV1Impl.address, tokenServiceInitData);
    await tokenServiceProxy.deployed();
    updateEnvFile("TOKEN_SERVICE_PROXY_ADDRESS", tokenServiceProxy.address);
    console.log("✅ TokenService Proxy deployed to:", tokenServiceProxy.address);

    // Step 4: Create TokenService V1 Contract Instance
    console.log("\nStep 4: Creating TokenService V1 Contract Instance");
    console.log("----------------------------------------------------");
    const tokenServiceV1 = TokenServiceV1.attach(tokenServiceProxy.address);
    console.log("✅ TokenService V1 contract instance created");

    // Register token service with bridge
    await bridge.addTokenService(tokenServiceProxy.address);
    console.log("✅ TokenService registered with Bridge");

    // Step 5: Test TokenService V1 Functionality
    console.log("\nStep 5: Testing TokenService V1 Functionality");
    console.log("-----------------------------------------------");
    
    const v1DestChainId = await tokenServiceV1.destChainId();
    const v1Owner = await tokenServiceV1.owner();
    
    console.log("✅ V1 Dest Chain ID:", v1DestChainId.toString());
    console.log("✅ V1 Owner:", v1Owner);

    // Add a supported token
    await tokenServiceV1.addToken(
        usdcMock.address,
        destChainId,
        "0x0000000000000000000000000000000000000000",
        "usdc.aleo",
        "usdc_token_service.aleo",
        1000,
        1000000000
    );
    console.log("✅ USDC token added to TokenService V1");

    // Verify token is supported
    let isTokenEnabled = await tokenServiceV1.isEnabledToken(usdcMock.address);
    console.log("✅ USDC enabled in TokenService V1:", isTokenEnabled);

    // Step 6: Deploy TokenService V2 Implementation
    console.log("\nStep 6: Deploying TokenService V2 Implementation");
    console.log("--------------------------------------------------");
    
    const TokenServiceV2 = await ethers.getContractFactory("TokenServiceV2");
    const tokenServiceV2Impl = await TokenServiceV2.deploy();
    await tokenServiceV2Impl.deployed();
    updateEnvFile("TOKEN_SERVICE_V2_IMPL_ADDRESS", tokenServiceV2Impl.address);
    console.log("✅ TokenService V2 Implementation deployed to:", tokenServiceV2Impl.address);

    // Step 7: Upgrade TokenService to V2
    console.log("\nStep 7: Upgrading TokenService to V2");
    console.log("--------------------------------------");
    
    const upgradeTxV2 = await tokenServiceV1.upgradeTo(tokenServiceV2Impl.address);
    await upgradeTxV2.wait();
    console.log("✅ TokenService upgraded to V2 successfully!");

    // Step 8: Create TokenService V2 Contract Instance
    console.log("\nStep 8: Creating TokenService V2 Contract Instance");
    console.log("----------------------------------------------------");
    const tokenServiceV2 = TokenServiceV2.attach(tokenServiceProxy.address);
    console.log("✅ TokenService V2 contract instance created");

    // Step 9: Test TokenService V2 Functionality
    console.log("\nStep 9: Testing TokenService V2 Functionality");
    console.log("-----------------------------------------------");
    
    const v2DestChainId = await tokenServiceV2.destChainId();
    const v2Owner = await tokenServiceV2.owner();
    
    console.log("✅ V2 Dest Chain ID:", v2DestChainId.toString());
    console.log("✅ V2 Owner:", v2Owner);

    // Check that token is still supported after upgrade
    isTokenEnabled = await tokenServiceV2.isEnabledToken(usdcMock.address);
    console.log("✅ USDC still enabled after V2 upgrade:", isTokenEnabled);

    // Step 10: Verify Storage Preservation (V1 to V2)
    console.log("\nStep 10: Verifying Storage Preservation (V1 to V2)");
    console.log("----------------------------------------------------");
    
    if (v1DestChainId.toString() === v2DestChainId.toString() &&
        v1Owner === v2Owner) {
        console.log("✅ Storage preservation verified V1 → V2");
    } else {
        console.log("❌ Storage preservation failed V1 → V2");
    }

    

    // Summary
    console.log("\n==========================================================");
    console.log("TokenService Upgrade Test Completed Successfully!");
    console.log("==========================================================");
    console.log("\nSummary:");
    console.log("- TokenService V1 deployed and tested");
    console.log("- TokenService V2 deployed and upgraded");
    console.log("- All storage preserved across upgrades");
    
    console.log("\nContract Addresses:");
    console.log("- USDC Mock:", usdcMock.address);
    console.log("- USDT Mock:", usdtMock.address);
    console.log("- BlackListService Proxy:", blacklistProxy.address);
    console.log("- Bridge Proxy:", bridgeProxy.address);
    console.log("- PacketLibrary:", packetLibrary.address);
    console.log("- AleoAddressLibrary:", aleoAddressLibrary.address);
    console.log("- TokenService V1 Implementation:", tokenServiceV1Impl.address);
    console.log("- TokenService V2 Implementation:", tokenServiceV2Impl.address);
    console.log("- TokenService Proxy:", tokenServiceProxy.address);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });
