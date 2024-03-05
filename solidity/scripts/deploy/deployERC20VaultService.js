import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );

    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const tokenAddr = process.env.USDC_ADDR;
    const Erc20VaultService = await ethers.getContractFactory("Erc20VaultService");
    console.log("Deploying Erc20VaultService Impl with the account:", deployerSigner.address);
    const erc20VaultServiceImpl = await Erc20VaultService.deploy();
    await erc20VaultServiceImpl.deployed();
    console.log("Erc20VaultService Impl Deployed to: ", erc20VaultServiceImpl.address);
    console.log("Deploying Erc20VaultService Proxy with the account:", deployerSigner.address);
    const ProxyContract = await ethers.getContractFactory("ProxyContract");

    const initializeData = new ethers.utils.Interface(Erc20VaultService.interface.format()).encodeFunctionData("Erc20VaultService_init", [tokenAddr, "ERC20VAULT"]);

    const erc20VaultServiceProxy = await ProxyContract.deploy(erc20VaultServiceImpl.address, initializeData);
    await erc20VaultServiceProxy.deployed();
    console.log("Erc20VaultService Proxy Deployed to: ", erc20VaultServiceProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });