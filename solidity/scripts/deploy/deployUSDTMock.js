import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://sepolia.base.org"
    );

    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const USDTMock = await ethers.getContractFactory("USDTMock");
    
    console.log("Deploying USDTMock with the account:", deployerSigner.address);
    const usdtMock = await USDTMock.deploy();
    await usdtMock.deployed();
    console.log("USDTMock Deployed to: ", usdtMock.address);
   }
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });