import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const tokenAddress = process.env.USDC_ADDR;

    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    console.log("Removing USDC to tokenservice...");
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);
    await TokenServiceContract.removeToken(tokenAddress);
    console.log("USDC removed successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });