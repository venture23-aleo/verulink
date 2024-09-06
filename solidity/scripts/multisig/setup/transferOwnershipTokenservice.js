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
    const TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxy = process.env.TOKENSERVICEPROXY_ADDRESS;
    console.log("Transferring Ownership of TokenService to = ", newOwner);
    const TokenServiceABI = TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxy, TokenServiceABI, deployerSigner);
    await TokenServiceContract.transferOwnership(newOwner);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });