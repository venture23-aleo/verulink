import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    console.log("=".repeat(80));
    console.log("🚀 DEPLOYING ALL CONTRACTS ON SEPOLIA WITHOUT WAIT TIME");
    console.log("=".repeat(80));
    
    const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER);
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    
    console.log("📍 Deployer Address:", deployerSigner.address);
    console.log("🌐 Network:", process.env.PROVIDER);
    console.log("=".repeat(80));

    const deployedContracts = [];
    const deploymentPromises = [];

    const destChainId = process.env.ALEO_CHAINID;
    const chainId = process.env.ETHEREUM_CHAINID;
    const ProxyContract = await ethers.getContractFactory("ProxyContract");


    try {
        // ====================================================================
        // STEP 1: Deploy Libraries (PacketLibrary V2)
        // ====================================================================
        console.log("\n📚 STEP 1: Deploying Libraries...");
        
        const PacketLibrary = await ethers.getContractFactory("PacketLibrary");
        console.log("  ➤ Deploying PacketLibrary...");
        const packetLibraryTx = await PacketLibrary.deploy();
        deploymentPromises.push(packetLibraryTx.deployTransaction);
        console.log("  ✓ PacketLibrary deployment initiated");
        

        // Wait for libraries to be deployed before proceeding
        console.log("\n⏳ Waiting for libraries to be mined...");
        await Promise.all(deploymentPromises);
        
        const packetLibrary = packetLibraryTx;
        
        console.log("  ✅ PacketLibrary deployed to:", packetLibrary.address);
        
        updateEnvFile("PACKET_LIBRARY_CONTRACT_ADDRESS", packetLibrary.address);
        
        deployedContracts.push({
            name: "PacketLibrary",
            address: packetLibrary.address,
            contract: "contracts/common/libraries/PacketLibrary.sol:PacketLibrary",
            constructorArgs: []
        });

        // // ====================================================================
        // // STEP 2: Deploy BlackListService (Implementation + Proxy)
        // // ====================================================================
        console.log("\n🚫 STEP 2: Deploying BlackListService...");
        
        const usdc = process.env.USDC_ADDR;
        const usdt = process.env.USDT_ADDR;
        const BlackListService = await ethers.getContractFactory("BlackListService");
        
        console.log("  ➤ Deploying BlackListService Implementation...");
        const blackListServiceImpl = await BlackListService.deploy();
        await blackListServiceImpl.deployTransaction.wait(2);
        console.log("  ✓ BlackListService Impl deployment initiated");
        console.log("  ✅ BlackListService Impl deployed to:", blackListServiceImpl.address);
        
        updateEnvFile("BLACKLISTSERVICE_IMPLEMENTATION_ADDRESS", blackListServiceImpl.address);
        
        deployedContracts.push({
            name: "BlackListService Implementation",
            address: blackListServiceImpl.address,
            contract: "contracts/main/tokenservice/BlackListService.sol:BlackListService",
            constructorArgs: []
        });
        
        console.log("  ➤ Deploying BlackListService Proxy...");
        
        const blacklistInitData = new ethers.utils.Interface(BlackListService.interface.format())
            .encodeFunctionData("BlackList_init", [usdc, usdt]);
        
        const blackListServiceProxy = await ProxyContract.deploy(blackListServiceImpl.address, blacklistInitData);
        console.log("  ✓ BlackListService Proxy deployment initiated");
        console.log("  ✅ BlackListService Proxy deployed to:", blackListServiceProxy.address);
        
        updateEnvFile("BLACKLISTSERVICE_PROXY_ADDRESS", blackListServiceProxy.address);
        
        deployedContracts.push({
            name: "BlackListService Proxy",
            address: blackListServiceProxy.address,
            contract: "contracts/proxies/Proxy.sol:ProxyContract",
            constructorArgs: [blackListServiceImpl.address, blacklistInitData]
        });

        // // ====================================================================
        // // STEP 3: Deploy BridgeV2 (Implementation + Proxy)
        // // ====================================================================
        console.log("\n🌉 STEP 3: Deploying Bridge...");
        
        const Bridge = await ethers.getContractFactory("BridgeV2", {
            libraries: {
                PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
                AleoAddressLibrary: process.env.ALEO_ADDRESS_LIBRARY,
            },
        });
        
        console.log("  ➤ Deploying Bridge Implementation...");
        const bridgeImpl = await Bridge.deploy();
        await bridgeImpl.deployTransaction.wait(1);
        console.log("  ✓ Bridge Impl deployment initiated");
        console.log("  ✅ Bridge Impl deployed to:", bridgeImpl.address);
        
        updateEnvFile("TOKENBRIDGE_NEW_IMPLEMENTATION_ADDRESS", bridgeImpl.address);
        
        deployedContracts.push({
            name: "BridgeV2 Implementation",
            address: bridgeImpl.address,
            contract: "contracts/main/BridgeV2.sol:BridgeV2",
            constructorArgs: []
        });

        // Upgrade Bridge Proxy to new implementation (if proxy already exists)
        if (process.env.TOKENBRIDGE_PROXY_ADDRESS) {
            console.log("  ➤ Upgrading Bridge Proxy to new implementation...");
            const ERC20BridgeABI = Bridge.interface.format();
            const BridgeContract = new ethers.Contract(process.env.TOKENBRIDGE_PROXY_ADDRESS, ERC20BridgeABI, deployerSigner);
            await BridgeContract.upgradeTo(bridgeImpl.address);
            console.log("  ✅ Bridge Proxy upgraded successfully to:", bridgeImpl.address);
        } else {
            console.log("  ⚠️  No existing Bridge Proxy found. Deploy a new proxy or set TOKENBRIDGE_PROXY_ADDRESS");
        }

        // // ====================================================================
        // // STEP 4: Initialize BridgeV2
        // // ====================================================================

        // if (process.env.TOKENBRIDGE_PROXY_ADDRESS) {
        //     console.log("  ➤ Initializing BridgeV2 via Proxy...");
        //     const BridgeABI = Bridge.interface.format();
        //     const BridgeProxyContract = new ethers.Contract(process.env.TOKENBRIDGE_PROXY_ADDRESS, BridgeABI, deployerSigner);
        //     const initTx = await BridgeProxyContract.initializeV2(2,5);
        //     await initTx.wait(2);
        //     console.log("  ✅ BridgeV2 initialized successfully via Proxy");
        // } else {
        //     console.log("  ⚠️  No existing Bridge Proxy found. Cannot initialize BridgeV2");
        // }

        // // ====================================================================
        // // STEP 5: Deploy Deploy TokenServiceV3 (Implementation)
        // // ====================================================================
        console.log("\n🪙 STEP 5: Deploying TokenServiceV3...");
        const TokenService = await ethers.getContractFactory("TokenServiceV3");
        
        console.log("  ➤ Deploying TokenServiceV3 Implementation...");
        const tokenServiceImpl = await TokenService.deploy();
        await tokenServiceImpl.deployTransaction.wait(3);
        console.log("  ✓ TokenServiceV3 Impl deployment initiated");
        console.log("  ✅ TokenServiceV3 Impl deployed to:", tokenServiceImpl.address);
        
        updateEnvFile("TOKENSERVICE_NEW_IMPLEMENTATION_ADDRESS", tokenServiceImpl.address);
        
        deployedContracts.push({
            name: "TokenServiceV3 Implementation",
            address: tokenServiceImpl.address,
            contract: "contracts/main/tokenservice/TokenServiceV3.sol:TokenServiceV3",
            constructorArgs: []
        });


        // Upgrade TokenService Proxy to new implementation (if proxy already exists)
        if (process.env.TOKENSERVICE_PROXY_ADDRESS) {
            console.log("  ➤ Upgrading TokenService Proxy to new implementation...");
            const ERC20TokenServiceABI = TokenService.interface.format();
            const TokenServiceContract = new ethers.Contract(process.env.TOKENSERVICE_PROXY_ADDRESS, ERC20TokenServiceABI, deployerSigner);
            await TokenServiceContract.upgradeTo(tokenServiceImpl.address);
            console.log("  ✅ TokenService Proxy upgraded successfully to:", tokenServiceImpl.address);
        } else {
            console.log("  ⚠️  No existing TokenService Proxy found. Deploy a new proxy or set TOKENSERVICE_PROXY_ADDRESS");
        }


        // ====================================================================
        // DEPLOYMENT SUMMARY
        // ====================================================================
        console.log("\n" + "=".repeat(80));
        console.log("✅ ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
        console.log("=".repeat(80));
        console.log("\n📋 DEPLOYMENT SUMMARY:\n");
        
        deployedContracts.forEach((contract, index) => {
            console.log(`${index + 1}. ${contract.name}`);
            console.log(`   Address: ${contract.address}`);
            console.log(`   Contract: ${contract.contract}\n`);
        });

        // ====================================================================
        // VERIFICATION INSTRUCTIONS
        // ====================================================================
        console.log("=".repeat(80));
        console.log("🔍 CONTRACT VERIFICATION");
        console.log("=".repeat(80));
        console.log("\n✨ Deployment complete! Environment variables have been updated in .env file\n");
        console.log("Or verify individual contracts manually:");
        console.log("  npx hardhat verify --network sepolia <CONTRACT_ADDRESS>\n");
        console.log("=".repeat(80) + "\n");

    } catch (error) {
        console.error("\n❌ ERROR DURING DEPLOYMENT:");
        console.error(error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
