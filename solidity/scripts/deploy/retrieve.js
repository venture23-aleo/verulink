import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const BlackListService = await ethers.getContractFactory("BlackListService");
    const blackListServiceProxyAddress = process.env.BLACKLISTSERVICEPROXY_ADDRESS;

    const BlackListServiceABI = BlackListService.interface.format();
    const BlackListServiceContract = new ethers.Contract(blackListServiceProxyAddress, BlackListServiceABI, deployerSigner);
    console.log(await BlackListServiceContract.add(2, 3));
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });