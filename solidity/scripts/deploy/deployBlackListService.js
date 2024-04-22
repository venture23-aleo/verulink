import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );

    const usdc = process.env.USDC_ADDR;
    const usdt = process.env.USDT_ADDR;
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const BlackListService = await ethers.getContractFactory("BlackListService");
    console.log("Deploying BlackListService Impl with the account:", deployerSigner.address);
    const blackListServiceImpl = await BlackListService.deploy();
    await blackListServiceImpl.deployed();
    console.log("BlackListService Impl Deployed to: ", blackListServiceImpl.address);
    console.log("Deploying BlackListService Proxy with the account:", deployerSigner.address);
    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData("BlackList_init", [usdc, usdt]);

    const blackListServiceProxy = await ProxyContract.deploy(blackListServiceImpl.address, initializeData);
    await blackListServiceProxy.deployed();
    console.log("BlackListService Proxy Deployed to: ", blackListServiceProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });