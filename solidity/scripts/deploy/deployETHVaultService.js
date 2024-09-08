import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const ETHVaultService = await ethers.getContractFactory("EthVaultService");
    
    console.log("Deploying EthVaultService Impl and Proxy...");

    const ethVaultServiceImpl = await ETHVaultService.deploy();
    await ethVaultServiceImpl.deployed();
    updateEnvFile("ETHVAULTSERVICEIMPL_ADDRESS", ethVaultServiceImpl.address)
    console.log("ETHVaultService Impl Deployed to: ", ethVaultServiceImpl.address);

    const ProxyContract = await ethers.getContractFactory("ProxyContract");

    const initializeData = new ethers.utils.Interface(ETHVaultService.interface.format()).encodeFunctionData("EthVaultService_init", ["ETHVAULT", deployerSigner.address]);
    const ethVaultServiceProxy = await ProxyContract.deploy(ethVaultServiceImpl.address, initializeData);
    await ethVaultServiceProxy.deployed();

    updateEnvFile("ETHVAULTSERVICEPROXY_ADDRESS", ethVaultServiceProxy.address)
    console.log("ETHVaultService Proxy Deployed to: ", ethVaultServiceProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });