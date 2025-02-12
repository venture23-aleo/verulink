import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    const ERC20TokenService = await ethers.getContractFactory("TokenServiceV2");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);

    console.log("Disabling predicate for TokenService...");
    await TokenServiceContract.disablePredicate();
    console.log("Predicate disabled successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });