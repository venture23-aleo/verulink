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
    const Holding = await ethers.getContractFactory("Holding");
    const holdingProxy = process.env.HOLDINGPROXY_ADDRESS;
    console.log("Transferring Ownership of Holding to = ", newOwner);
    const HoldingABI = Holding.interface.format();
    const HoldingContract = new ethers.Contract(holdingProxy, HoldingABI, deployerSigner);
    await HoldingContract.transferOwnership(newOwner);    
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });