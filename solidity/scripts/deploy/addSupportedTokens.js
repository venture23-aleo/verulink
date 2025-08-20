import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const tokenServiceProxy = process.env.TOKENSERVICE_PROXY_ADDRESS;
    const Holding = await ethers.getContractFactory("Holding");

    const HoldingProxy = process.env.HOLDING_PROXY_ADDRESS;
    console.log("Adding Tokenservice from Holding...");
    const HoldingABI = Holding.interface.format();
    const HoldingContract = new ethers.Contract(HoldingProxy, HoldingABI, deployerSigner);
    await HoldingContract.addTokenService(tokenServiceProxy);
    console.log("TokenService Successfully added!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });