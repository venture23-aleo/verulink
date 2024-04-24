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
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxy = process.env.TOKENSERVICEPROXY_ADDRESS;
    let TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceCotract = new ethers.Contract(tokenServiceProxy, TokenServiceABI, deployerSigner);
    console.log("Transferring Ownership to = ", newOwner.address);
    await TokenServiceCotract.transferOwnership(newOwner.address);
    console.log("TokenService New Owner = ", await TokenServiceCotract.owner());
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });