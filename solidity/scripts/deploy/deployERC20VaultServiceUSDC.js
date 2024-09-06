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
    const tokenAddr = process.env.USDC_ADDR;
    const Erc20VaultService = await ethers.getContractFactory("Erc20VaultService");

    const erc20VaultServiceImpl = await Erc20VaultService.deploy();
    await erc20VaultServiceImpl.deployed();
    updateEnvFile("ERC20VAULTSERVICEIMPL_ADDRESS_USDC", erc20VaultServiceImpl.address)
    console.log("Erc20VaultServiceUSDC Impl Deployed to: ", erc20VaultServiceImpl.address);

    const ProxyContract = await ethers.getContractFactory("ProxyContract");

    const initializeData = new ethers.utils.Interface(Erc20VaultService.interface.format()).encodeFunctionData("Erc20VaultService_init", [tokenAddr, "ERC20VAULT", deployerSigner.address]);
    const erc20VaultServiceProxy = await ProxyContract.deploy(erc20VaultServiceImpl.address, initializeData);
    await erc20VaultServiceProxy.deployed();

    updateEnvFile("ERC20VAULTSERVICEPROXY_ADDRESS_USDC", erc20VaultServiceProxy.address)
    console.log("Erc20VaultServiceUSDC Proxy Deployed to: ", erc20VaultServiceProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });