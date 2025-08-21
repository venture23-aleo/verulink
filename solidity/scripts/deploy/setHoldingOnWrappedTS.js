import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const new_holding = process.env.HOLDING_PROXY_ADDRESS;
    const ERC20TokenService = await ethers.getContractFactory("TokenServiceWrapped");
    const tokenServiceProxyAddress = process.env.WRAPPED_TOKENSERVICE_PROXY_ADDRESS;
    console.log("Setting Holding to TokenService Wrapped...");
    const ERC20TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, ERC20TokenServiceABI, deployerSigner);
    await TokenServiceContract.setHolding(new_holding);
    console.log("Holding set successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });