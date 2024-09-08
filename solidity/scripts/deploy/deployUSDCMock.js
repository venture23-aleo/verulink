import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const USDCMock = await ethers.getContractFactory("USDCMock");
    
    console.log("Deploying USDCMock with the account:", deployerSigner.address);
    const usdcMock = await USDCMock.deploy();
    await usdcMock.deployed();
    updateEnvFile("USDC_ADDR", usdcMock.address)
    console.log("USDCMock Deployed to: ", usdcMock.address);
   }
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });