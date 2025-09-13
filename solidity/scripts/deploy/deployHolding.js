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
    const Holding = await ethers.getContractFactory("Holding")

    // console.log("Deploying Holding Impl and Proxy...");

    // const holdingImpl = await Holding.deploy();
    // await holdingImpl.deployTransaction.wait(3);
    // console.log("Holding Impl Deployed to: ", holdingImpl.address);
    // console.log("Verifying impl contract...");
    // await run("verify:verify", {
    //     address: holdingImpl.address,
    //     constructorArguments: [], // Pass the constructor arguments here
    //     contract: "contracts/main/Holding.sol:Holding"
    // });
    // updateEnvFile("HOLDING_IMPLEMENTATION_ADDRESS", holdingImpl.address);

    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    
    const initializeData = new ethers.utils.Interface(Holding.interface.format()).encodeFunctionData("Holding_init", [process.env.WRAPPED_TOKEN_PROXY_ADDRESS, deployerSigner.address]);
    const holdingProxy = await ProxyContract.deploy("0x19baFAd40D6961eC1ca81239F2820a5F32f4429E", initializeData);
    await holdingProxy.deployTransaction.wait(3);

    console.log("Holding Proxy Deployed to: ", holdingProxy.address);
    console.log("Verifying proxy contract...");

    await run("verify:verify", {
        address: holdingProxy.address,
        constructorArguments: ["0x19baFAd40D6961eC1ca81239F2820a5F32f4429E", initializeData], // Pass the constructor arguments here
        contract: "contracts/proxies/Proxy.sol:ProxyContract"
    });
    updateEnvFile("HOLDING_PROXY_ADDRESS", holdingProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });