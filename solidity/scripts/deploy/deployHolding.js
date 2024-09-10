import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const Holding = await ethers.getContractFactory("Holding")

    console.log("Deploying Holding Impl and Proxy...");

    const holdingImpl = await Holding.deploy();
    await holdingImpl.deployed();
    updateEnvFile("HOLDING_IMPLEMENTATION_ADDRESS", holdingImpl.address);
    console.log("Holding Impl Deployed to: ", holdingImpl.address);

    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    
    const initializeData = new ethers.utils.Interface(Holding.interface.format()).encodeFunctionData("Holding_init", [process.env.TOKENSERVICE_PROXY_ADDRESS, deployerSigner.address]);
    const holdingProxy = await ProxyContract.deploy(holdingImpl.address, initializeData);
    await holdingProxy.deployed();

    updateEnvFile("HOLDING_PROXY_ADDRESS", holdingProxy.address);
    console.log("Holding Proxy Deployed to: ", holdingProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });