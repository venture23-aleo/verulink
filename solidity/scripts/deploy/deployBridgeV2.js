import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const destChainId = process.env.ALEO_CHAINID;
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const Bridge = await ethers.getContractFactory("BridgeV2", {
        libraries: {
            PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
            AleoAddressLibrary: process.env.ALEO_ADDRESS_LIBRARY,
        },
    });

    console.log("Deploying Bridge Impl and Proxy...");

    const bridgeImpl = await Bridge.deploy();
    await bridgeImpl.deployTransaction.wait(3);
    console.log("Bridge Impl Deployed to: ", bridgeImpl.address);
    // Verification process
    console.log("Verifying impl contract...");
    await run("verify:verify", {
        address: bridgeImpl.address,
        constructorArguments: [], // Pass the constructor arguments here
        contract: "contracts/main/BridgeV2.sol:BridgeV2"
    });

    updateEnvFile("TOKENBRIDGE_IMPLEMENTATION_ADDRESS", bridgeImpl.address);
    const ProxyContract = await ethers.getContractFactory("ProxyContract");

    const initializeData = new ethers.utils.Interface(Bridge.interface.format()).encodeFunctionData("Bridge_init", [destChainId, deployerSigner.address]);

    const bridgeProxy = await ProxyContract.deploy(bridgeImpl.address, initializeData);
    await bridgeProxy.deployTransaction.wait(3);

    console.log("Bridge Proxy Deployed to: ", bridgeProxy.address);
    console.log("Verifying proxy contract...");

    await run("verify:verify", {
        address: bridgeProxy.address,
        constructorArguments: [bridgeImpl.address, initializeData], // Pass the constructor arguments here
        contract: "contracts/proxies/Proxy.sol:ProxyContract"
    });
    updateEnvFile("TOKENBRIDGE_PROXY_ADDRESS", bridgeProxy.address)
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });