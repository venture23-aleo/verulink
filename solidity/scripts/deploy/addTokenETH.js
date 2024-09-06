import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const tokenAddress = process.env.ONE_ADDRESS;
    const vault = process.env.ETHVAULTSERVICEPROXY_ADDRESS;
    const destChainId = process.env.aleoChainId;
    const destTokenAddress = process.env.destTokenAddressWETH;
    const destTokenService = process.env.destTokenService;
    const min = process.env.minWETH;
    const max = process.env.maxWETH;

    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICEPROXY_ADDRESS;
    const ERC20TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, ERC20TokenServiceABI, deployerSigner);
    await TokenServiceContract.addToken(tokenAddress, destChainId, vault, destTokenAddress, destTokenService, min, max);
    console.log("ETH added successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });