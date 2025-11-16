import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const tokenAddress = process.env.WRAPPED_TOKEN_PROXY_ADDRESS;

    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const WrappedTokenService = await ethers.getContractFactory("TokenServiceWrapped");
    const tokenServiceProxyAddress = process.env.WRAPPED_TOKENSERVICE_PROXY_ADDRESS;
    console.log("Removing Wrapped Aleo Token from tokenservice...");
    const TokenServiceABI = WrappedTokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);
    await TokenServiceContract.removeToken(tokenAddress);
    console.log("Wrapped Aleo Token removed successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });