import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const tokenAddress = process.env.USDT_ADDR;
    const new_minval = process.env.MIN_WUSDT;
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    console.log("Updating Min value of WUSDT...");
    const ERC20TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, ERC20TokenServiceABI, deployerSigner);
    await TokenServiceContract.updateMinValue(tokenAddress, new_minval);
    console.log("Min value for token updated!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });