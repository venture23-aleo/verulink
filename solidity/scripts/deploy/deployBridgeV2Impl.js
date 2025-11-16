import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
   
    const Bridge = await ethers.getContractFactory("BridgeV2", {
        libraries: {
            PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
            AleoAddressLibrary: process.env.ALEO_ADDRESS_LIBRARY,
        },
    });
    console.log("Deploying BridgeV2 Implementation...");

    const bridgeImpl = await Bridge.deploy();
    await bridgeImpl.deployTransaction.wait(3);
    updateEnvFile("TOKENBRIDGE_NEW_IMPLEMENTATION_ADDRESS", bridgeImpl.address);
    console.log("BridgeV2 Impl Deployed to: ", bridgeImpl.address);
    // Verification process
    console.log("Verifying impl contract...");
    await run("verify:verify", {
        address: bridgeImpl.address,
        constructorArguments: [], // Pass the constructor arguments here
        contract: "contracts/main/BridgeV2.sol:BridgeV2"
    });
    
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });