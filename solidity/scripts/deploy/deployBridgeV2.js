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

    console.log("Deploying Bridge Impl Contract...");

    const bridgeImpl = await Bridge.deploy();
    await bridgeImpl.deployTransaction.wait(3);
    console.log("Bridge Impl Deployed to: ", bridgeImpl.address);
    updateEnvFile("TOKENBRIDGE_IMPLEMENTATION_ADDRESS", bridgeImpl.address);
    // Verification process
    console.log("Verifying impl contract...");
    await run("verify:verify", {
        address: process.env.TOKENBRIDGE_NEW_IMPLEMENTATION_ADDRESS,
        constructorArguments: [], // Pass the constructor arguments here
        contract: "contracts/main/BridgeV2.sol:BridgeV2"
    });

    console.log("Deploying Bridge Proxy Contract...");
    const bridgeImplAddress = process.env.TOKENBRIDGE_IMPLEMENTATION_ADDRESS;
    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const initializeData = new ethers.utils.Interface(Bridge.interface.format()).encodeFunctionData("Bridge_init", [destChainId, deployerSigner.address]);

    const bridgeProxy = await ProxyContract.deploy(bridgeImplAddress, initializeData);
    await bridgeProxy.deployTransaction.wait(3);

    console.log("Bridge Proxy Deployed to: ", bridgeProxy.address);
    updateEnvFile("TOKENBRIDGE_PROXY_ADDRESS", bridgeProxy.address)
    console.log("Verifying proxy contract...");

    await run("verify:verify", {
        address: bridgeProxy.address,
        constructorArguments: [bridgeImplAddress, initializeData], // Pass the constructor arguments here
        contract: "contracts/proxies/Proxy.sol:ProxyContract"
    });
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });