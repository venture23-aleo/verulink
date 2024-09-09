import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const newOwner = process.env.SAFE_ADDRESS;
    const ETHVaultService = await ethers.getContractFactory("EthVaultService");
    const ethVaultServiceProxy = process.env.ETHVAULTSERVICE_PROXY_ADDRESS;
    console.log("Transferring Ownership of EthVaultService to = ", newOwner);
    const ETHVaultServiceABI = ETHVaultService.interface.format();
    const ETHVaultServiceContract = new ethers.Contract(ethVaultServiceProxy, ETHVaultServiceABI, deployerSigner);
    await ETHVaultServiceContract.transferOwnership(newOwner);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });