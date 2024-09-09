import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const usdc = process.env.USDC_ADDR;
    const usdt = process.env.USDT_ADDR;

    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const BlackListService = await ethers.getContractFactory("BlackListService");

    console.log("Deploying BlacklistService Impl and Proxy...");

    const blackListServiceImpl = await BlackListService.deploy();
    await blackListServiceImpl.deployed();
    updateEnvFile("BLACKLISTSERVICE_IMPLEMENTATION_ADDRESS", blackListServiceImpl.address)
    console.log("BlackListService Impl Deployed to: ", blackListServiceImpl.address);

    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData("BlackList_init", [usdc, usdt, deployerSigner.address]);

    const blackListServiceProxy = await ProxyContract.deploy(blackListServiceImpl.address, initializeData);
    await blackListServiceProxy.deployed();

    updateEnvFile("BLACKLISTSERVICE_PROXY_ADDRESS", blackListServiceProxy.address)
    console.log("BlackListService Proxy Deployed to: ", blackListServiceProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });