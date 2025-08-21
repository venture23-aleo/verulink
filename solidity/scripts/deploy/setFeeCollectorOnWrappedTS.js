import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const tokenService = await ethers.getContractFactory("TokenServiceWrapped");
    const tokenServiceProxyAddress = process.env.WRAPPED_TOKENSERVICE_PROXY_ADDRESS;
    console.log("Setting up the fee collector address...");
    const tokenServiceABI = tokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, tokenServiceABI, deployerSigner);
    await TokenServiceContract.setFeeCollector(process.env.FEECOLLECTOR_PROXY_ADDRESS);
    console.log("Fee collector address updated successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });