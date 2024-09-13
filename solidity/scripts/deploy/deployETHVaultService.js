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
    const ETHVaultService = await ethers.getContractFactory("EthVaultService");
    
    console.log("Deploying EthVaultService Impl and Proxy...");

    const ethVaultServiceImpl = await ETHVaultService.deploy();
    await ethVaultServiceImpl.deployTransaction.wait(3);
    console.log("ETHVaultService Impl Deployed to: ", ethVaultServiceImpl.address);
    console.log("Verifying impl contract...");
    await run("verify:verify", {
        address: ethVaultServiceImpl.address,
        constructorArguments: [], // Pass the constructor arguments here
        contract: "contracts/main/tokenservice/vault/EthVaultService.sol:EthVaultService"
    });
    updateEnvFile("ETHVAULTSERVICE_IMPL_ADDRESS", ethVaultServiceImpl.address)

    const ProxyContract = await ethers.getContractFactory("ProxyContract");

    const initializeData = new ethers.utils.Interface(ETHVaultService.interface.format()).encodeFunctionData("EthVaultService_init", ["ETHVAULT", deployerSigner.address]);
    const ethVaultServiceProxy = await ProxyContract.deploy(ethVaultServiceImpl.address, initializeData);
    await ethVaultServiceProxy.deployTransaction.wait(3);

    console.log("ETHVaultService Proxy Deployed to: ", ethVaultServiceProxy.address);
    console.log("Verifying proxy contract...");

    await run("verify:verify", {
        address: ethVaultServiceProxy.address,
        constructorArguments: [ethVaultServiceImpl.address, initializeData], // Pass the constructor arguments here
        contract: "contracts/proxies/Proxy.sol:ProxyContract"
    });
    updateEnvFile("ETHVAULTSERVICE_PROXY_ADDRESS", ethVaultServiceProxy.address)
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });