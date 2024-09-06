import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const newOwner = process.env.SAFE_ADDRESS;
    const BlackListService = await ethers.getContractFactory("BlackListService");
    const blackListServiceProxy = process.env.BLACKLISTSERVICEPROXY_ADDRESS;
    console.log("Transferring Ownership of BlackListService to = ", newOwner);
    const BlackListServiceABI = BlackListService.interface.format();
    const BlackListServiceContract = new ethers.Contract(blackListServiceProxy, BlackListServiceABI, deployerSigner);
    await BlackListServiceContract.transferOwnership(newOwner);    
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });