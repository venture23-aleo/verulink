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
    const Holding = await ethers.getContractFactory("Holding");
    const holdingProxy = process.env.HOLDINGPROXY_ADDRESS;
    const HoldingABI = Holding.interface.format();
    const HoldingCotract = new ethers.Contract(holdingProxy, HoldingABI, deployerSigner);
    console.log("Transferring Ownership to = ", newOwner.address);
    await HoldingCotract.transferOwnership(newOwner.address);
    console.log("Holding New Owner = ", await HoldingCotract.owner());
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });