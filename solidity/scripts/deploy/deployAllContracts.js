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
        // STEP 1: Deploy Libraries (PacketLibrary and AleoAddressLibrary)
        // ====================================================================
        console.log("\n📚 STEP 1: Deploying Libraries...");
        
        const PacketLibrary = await ethers.getContractFactory("PacketLibrary");
        console.log("  ➤ Deploying PacketLibrary...");
        const packetLibraryTx = await PacketLibrary.deploy();
        deploymentPromises.push(packetLibraryTx.deployTransaction);
        console.log("  ✓ PacketLibrary deployment initiated");
        
        const AleoAddressLibrary = await ethers.getContractFactory("AleoAddressLibrary");
        console.log("  ➤ Deploying AleoAddressLibrary...");
        const aleoAddressLibraryTx = await AleoAddressLibrary.deploy();
        deploymentPromises.push(aleoAddressLibraryTx.deployTransaction);
        console.log("  ✓ AleoAddressLibrary deployment initiated");

        // Wait for libraries to be deployed before proceeding
        console.log("\n⏳ Waiting for libraries to be mined...");
        await Promise.all(deploymentPromises);
        
        const packetLibrary = packetLibraryTx;
        const aleoAddressLibrary = aleoAddressLibraryTx;
        
        console.log("  ✅ PacketLibrary deployed to:", packetLibrary.address);
        console.log("  ✅ AleoAddressLibrary deployed to:", aleoAddressLibrary.address);
        
        updateEnvFile("PACKET_LIBRARY_CONTRACT_ADDRESS", packetLibrary.address);
        updateEnvFile("ALEO_ADDRESS_LIBRARY", aleoAddressLibrary.address);
        
        deployedContracts.push({
            name: "PacketLibrary",
            address: packetLibrary.address,
            contract: "contracts/common/libraries/PacketLibrary.sol:PacketLibrary",
            constructorArgs: []
        });
        
        deployedContracts.push({
            name: "AleoAddressLibrary",
            address: aleoAddressLibrary.address,
            contract: "contracts/common/libraries/AleoAddressLibrary.sol:AleoAddressLibrary",
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
            .encodeFunctionData("BlackList_init", [usdc, usdt, deployerSigner.address]);
        
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
        // // STEP 3: Deploy Bridge (Implementation + Proxy)
        // // ====================================================================
        console.log("\n🌉 STEP 3: Deploying Bridge...");
        
        
        const Bridge = await ethers.getContractFactory("Bridge", {
            libraries: {
                PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
                AleoAddressLibrary: process.env.ALEO_ADDRESS_LIBRARY,
            },
        });
        
        console.log("  ➤ Deploying Bridge Implementation...");
        const bridgeImpl = await Bridge.deploy();
        await bridgeImpl.deployTransaction.wait(3);
        console.log("  ✓ Bridge Impl deployment initiated");
        console.log("  ✅ Bridge Impl deployed to:", bridgeImpl.address);
        
        updateEnvFile("TOKENBRIDGE_IMPLEMENTATION_ADDRESS", bridgeImpl.address);
        
        deployedContracts.push({
            name: "Bridge Implementation",
            address: bridgeImpl.address,
            contract: "contracts/main/Bridge.sol:Bridge",
            constructorArgs: []
        });
        
        console.log("  ➤ Deploying Bridge Proxy...");
        const bridgeInitData = new ethers.utils.Interface(Bridge.interface.format())
            .encodeFunctionData("Bridge_init", [destChainId, deployerSigner.address]);
        
        const bridgeProxy = await ProxyContract.deploy(bridgeImpl.address, bridgeInitData);
        console.log("  ✓ Bridge Proxy deployment initiated");
        console.log("  ✅ Bridge Proxy deployed to:", bridgeProxy.address);
        
        updateEnvFile("TOKENBRIDGE_PROXY_ADDRESS", bridgeProxy.address);
        
        deployedContracts.push({
            name: "Bridge Proxy",
            address: bridgeProxy.address,
            contract: "contracts/proxies/Proxy.sol:ProxyContract",
            constructorArgs: [bridgeImpl.address, bridgeInitData]
        });
        
        // ====================================================================
        // STEP 4: Deploy TokenServiceV2 (Implementation + Proxy)
        // ====================================================================
        console.log("\n🪙 STEP 4: Deploying TokenServiceV2...");
        const TokenService = await ethers.getContractFactory("TokenServiceV2");
        
        console.log("  ➤ Deploying TokenServiceV2 Implementation...");
        const tokenServiceImpl = await TokenService.deploy();
        await tokenServiceImpl.deployTransaction.wait(3);
        console.log("  ✓ TokenServiceV2 Impl deployment initiated");
        console.log("  ✅ TokenServiceV2 Impl deployed to:", tokenServiceImpl.address);
        
        updateEnvFile("TOKENSERVICE_IMPLEMENTATION_ADDRESS", tokenServiceImpl.address);

        const tokenServiceImplAddress = process.env.TOKENSERVICE_IMPLEMENTATION_ADDRESS;
        
        deployedContracts.push({
            name: "TokenServiceV2 Implementation",
            address: tokenServiceImpl.address,
            contract: "contracts/main/tokenservice/TokenServiceV2.sol:TokenServiceV2",
            constructorArgs: []
        });
        
        console.log("  ➤ Deploying TokenServiceV2 Proxy...");
        const tokenServiceInitData = new ethers.utils.Interface(TokenService.interface.format())
            .encodeFunctionData("TokenService_init", 
                [process.env.TOKENBRIDGE_PROXY_ADDRESS, deployerSigner.address, chainId, destChainId, process.env.BLACKLISTSERVICE_PROXY_ADDRESS]);
        
        const tokenServiceProxy = await ProxyContract.deploy(tokenServiceImplAddress, tokenServiceInitData);
        console.log("  ✓ TokenServiceV2 Proxy deployment initiated");
        console.log("  ✅ TokenServiceV2 Proxy deployed to:", tokenServiceProxy.address);
        
        updateEnvFile("TOKENSERVICE_PROXY_ADDRESS", tokenServiceProxy.address);

        deployedContracts.push({
            name: "TokenServiceV2 Proxy",
            address: tokenServiceProxy.address,
            contract: "contracts/proxies/Proxy.sol:ProxyContract",
            constructorArgs: [tokenServiceImplAddress, tokenServiceInitData]
        });

        // ====================================================================
        // STEP 5: Deploy Holding (Implementation + Proxy)
        // ====================================================================
        console.log("\n🏦 STEP 5: Deploying Holding...");
        
        const Holding = await ethers.getContractFactory("Holding");
        
        console.log("  ➤ Deploying Holding Implementation...");
        const holdingImpl = await Holding.deploy();
        await holdingImpl.deployTransaction.wait(1);
        console.log("  ✓ Holding Impl deployment initiated");
        console.log("  ✅ Holding Impl deployed to:", holdingImpl.address);
        
        updateEnvFile("HOLDING_IMPLEMENTATION_ADDRESS", holdingImpl.address);
        
        deployedContracts.push({
            name: "Holding Implementation",
            address: holdingImpl.address,
            contract: "contracts/main/Holding.sol:Holding",
            constructorArgs: []
        });
        
        console.log("  ➤ Deploying Holding Proxy...");
        const holdingInitData = new ethers.utils.Interface(Holding.interface.format())
            .encodeFunctionData("Holding_init", [tokenServiceProxy.address, deployerSigner.address]);
        
        const holdingProxy = await ProxyContract.deploy(holdingImpl.address, holdingInitData);
        console.log("  ✓ Holding Proxy deployment initiated");
        console.log("  ✅ Holding Proxy deployed to:", holdingProxy.address);
        
        updateEnvFile("HOLDING_PROXY_ADDRESS", holdingProxy.address);
        
        deployedContracts.push({
            name: "Holding Proxy",
            address: holdingProxy.address,
            contract: "contracts/proxies/Proxy.sol:ProxyContract",
            constructorArgs: [holdingImpl.address, holdingInitData]
        });

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
        // VERIFICATION COMMANDS
        // ====================================================================
        console.log("=".repeat(80));
        console.log("🔍 VERIFICATION COMMANDS (Run these manually if needed):");
        console.log("=".repeat(80));
        console.log("\nYou can verify contracts using the following commands:\n");
        
        deployedContracts.forEach((contract) => {
            const argsStr = contract.constructorArgs.length > 0 
                ? ` ${contract.constructorArgs.map(arg => `"${arg}"`).join(' ')}`
                : '';
            console.log(`npx hardhat verify --contract ${contract.contract} --network sepolia ${contract.address}${argsStr}`);
        });

        console.log("\n" + "=".repeat(80));
        console.log("✨ Deployment complete! Environment variables have been updated in .env file");
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
