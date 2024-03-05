import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const newOwner = "0xEA303C67d1571a29953dc8608fDbD966c3D5Fe11";
    const EthVaultService = await ethers.getContractFactory("EthVaultService");
    const ethVaultServiceProxy = process.env.ETHVAULTSERVICEPROXY_ADDRESS;
    const EthVaultServiceABI = EthVaultService.interface.format();
    const EthVaultServiceCotract = new ethers.Contract(ethVaultServiceProxy, EthVaultServiceABI, deployerSigner);
    console.log("Transferring Ownership to = ", newOwner);
    await EthVaultServiceCotract.transferOwnership(newOwner);
    console.log("EthVaultService New Owner = ", await EthVaultServiceCotract.owner());
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });