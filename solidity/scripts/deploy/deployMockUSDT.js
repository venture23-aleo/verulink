import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const mockUSDT = await ethers.getContractFactory("USDTMock")

    console.log("Deploying Mock USDT");

    const USDTImpl = await mockUSDT.deploy();
    await USDTImpl.deployed();

    updateEnvFile("USDT_ADDR", USDTImpl.address);
    console.log("Mock USDT Deployed to: ", USDTImpl.address);

    await USDTImpl.mint(deployerSigner.address, 1000000000000);
    
    
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });