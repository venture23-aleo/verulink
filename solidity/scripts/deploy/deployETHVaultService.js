import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );

    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const ETHVaultService = await ethers.getContractFactory("EthVaultService");
    console.log("Deploying ETHVaultService Impl with the account:", deployerSigner.address);
    const ethVaultServiceImpl = await ETHVaultService.deploy();
    await ethVaultServiceImpl.deployed();
    console.log("ETHVaultService Impl Deployed to: ", ethVaultServiceImpl.address);
    console.log("Deploying ETHVaultService Proxy with the account:", deployerSigner.address);
    const ProxyContract = await ethers.getContractFactory("ProxyContract");

    const initializeData = new ethers.utils.Interface(ETHVaultService.interface.format()).encodeFunctionData("EthVaultService_init", ["ETHVAULT"]);

    const ethVaultServiceProxy = await ProxyContract.deploy(ethVaultServiceImpl.address, initializeData);
    await ethVaultServiceProxy.deployed();
    console.log("ETHVaultService Proxy Deployed to: ", ethVaultServiceProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });