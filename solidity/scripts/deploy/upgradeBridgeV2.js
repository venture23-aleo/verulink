import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    // libraries contracts 
    const aleoAddressLib = process.env.ALEO_ADDRESS_LIBRARY;
    const packetLib = process.env.PACKET_LIBRARY_CONTRACT_ADDRESS;

    // Deploy BridgeV2 
    console.log("Deploying BridgeV2...");
    const Bridge = await ethers.getContractFactory("BridgeV2", {
        libraries: {
            AleoAddressLibrary: aleoAddressLib,
            PacketLibrary: packetLib
        }
    });

    const bridgeImpl = await Bridge.deploy();
    await bridgeImpl.deployTransaction.wait(3);
    console.log("Bridge V2 Impl Deployed to: ", bridgeImpl.address);

    // Verification process
    console.log("Verifying impl contract...");
    await run("verify:verify", {
        address: bridgeImpl.address,
        constructorArguments: [], // Pass the constructor arguments here
        contract: "contracts/main/BridgeV2.sol:BridgeV2",
        libraries: {
            AleoAddressLibrary: aleoAddressLib,
            PacketLibrary: packetLib
        }
    });
    updateEnvFile("TOKENBRIDGE_NEW_IMPLEMENTATION_ADDRESS", bridgeImpl.address);

    const bridgeProxyAddress = process.env.TOKENBRIDGE_PROXY_ADDRESS;
    console.log("Upgrading Bridge Implementation...");
    const ERC20BridgeABI = Bridge.interface.format();
    const BridgeContract = new ethers.Contract(bridgeProxyAddress, ERC20BridgeABI, deployerSigner);
    await BridgeContract.upgradeTo(process.env.TOKENBRIDGE_NEW_IMPLEMENTATION_ADDRESS);
    console.log("Bridge Proxy upgraded successfully!!!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });