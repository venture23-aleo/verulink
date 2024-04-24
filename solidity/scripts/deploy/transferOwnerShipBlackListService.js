import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const newOwner = new ethers.Wallet(process.env.SECRET_KEY5, provider);
    const BlackListService = await ethers.getContractFactory("BlackListService");
    const blackListServiceProxy = process.env.BLACKLISTSERVICEPROXY_ADDRESS;
    const BlackListServiceABI = BlackListService.interface.format();
    const BlackListServiceCotract = new ethers.Contract(blackListServiceProxy, BlackListServiceABI, deployerSigner);
    console.log("Transferring Ownership to = ", newOwner.address);
    await BlackListServiceCotract.transferOwnership(newOwner.address);
    console.log("BlackListService New Owner = ", await BlackListServiceCotract.owner());
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });