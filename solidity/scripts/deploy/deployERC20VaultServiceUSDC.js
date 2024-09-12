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
    const tokenAddr = process.env.USDC_ADDR;
    const Erc20VaultService = await ethers.getContractFactory("Erc20VaultService");

    console.log("Deploying Erc20VaultServiceUSDC Impl and Proxy...");

    const erc20VaultServiceImpl = await Erc20VaultService.deploy();
    await erc20VaultServiceImpl.deployTransaction.wait(3);
    console.log("Erc20VaultServiceUSDC Impl Deployed to: ", erc20VaultServiceImpl.address);
    // Verification process
    console.log("Verifying impl contract...");
    await run("verify:verify", {
        address: erc20VaultServiceImpl.address,
        constructorArguments: [], // Pass the constructor arguments here
        contract: "contracts/main/tokenservice/vault/Erc20VaultService.sol:Erc20VaultService"
    });

    updateEnvFile("ERC20VAULTSERVICE_IMPL_ADDRESS_USDC", erc20VaultServiceImpl.address)

    const ProxyContract = await ethers.getContractFactory("ProxyContract");

    const initializeData = new ethers.utils.Interface(Erc20VaultService.interface.format()).encodeFunctionData("Erc20VaultService_init", [tokenAddr, "ERC20VAULTUSDC", deployerSigner.address]);
    const erc20VaultServiceProxy = await ProxyContract.deploy(erc20VaultServiceImpl.address, initializeData);
    await erc20VaultServiceProxy.deployTransaction.wait(3);
    console.log("Erc20VaultServiceUSDC Proxy Deployed to: ", erc20VaultServiceProxy.address);
    console.log("Verifying proxy contract...");

    await run("verify:verify", {
        address: erc20VaultServiceProxy.address,
        constructorArguments: [erc20VaultServiceImpl.address, initializeData], // Pass the constructor arguments here
        contract: "contracts/proxies/Proxy.sol:ProxyContract"
    });

    updateEnvFile("ERC20VAULTSERVICE_PROXY_ADDRESS_USDC", erc20VaultServiceProxy.address)
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
