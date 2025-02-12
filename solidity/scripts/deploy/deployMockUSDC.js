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
    const mockUSDC = await ethers.getContractFactory("USDCMock")

    console.log("Deploying Mock USDC");

    console.log(await provider.getBalance(deployerSigner.address));

    const USDCImpl = await mockUSDC.deploy();
    await USDCImpl.deployed();

    updateEnvFile("USDC_ADDR", USDCImpl.address);
    console.log("Mock USDC Deployed to: ", USDCImpl.address);

    await USDCImpl.mint(deployerSigner.address, 1000000000000);
    
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });