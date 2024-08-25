import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );

    const usdc = process.env.USDC_ADDR;
    const usdt = process.env.USDT_ADDR;
    const SAFE_ADDRESS = process.env.SAFE_ADDRESS;

    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const BlackListService = await ethers.getContractFactory("BlackListService");

    const blackListServiceImpl = await BlackListService.deploy();
    await blackListServiceImpl.deployed();
    updateEnvFile("BLACKLISTSERVICEIMPLEMENTATION_ADDRESS", blackListServiceImpl.address)
    console.log("BlackListService Impl Deployed to: ", blackListServiceImpl.address);

    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData("BlackList_init", [usdc, usdt, deployerSigner.address]);

    const blackListServiceProxy = await ProxyContract.deploy(blackListServiceImpl.address, initializeData);
    await blackListServiceProxy.deployed();
    const BlackListServiceABI = BlackListService.interface.format();
    const BlackListServiceContract = new ethers.Contract(blackListServiceProxy.address, BlackListServiceABI, deployerSigner);
    await BlackListServiceContract.transferOwnership(SAFE_ADDRESS);

    updateEnvFile("BLACKLISTSERVICEPROXY_ADDRESS", blackListServiceProxy.address)
    console.log("BlackListService Proxy Deployed to: ", blackListServiceProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });