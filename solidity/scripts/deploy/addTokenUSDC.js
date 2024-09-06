import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const tokenAddress = process.env.USDC_ADDR;
    const vault = process.env.ERC20VAULTSERVICEPROXY_ADDRESS_USDC;
    const destChainId = process.env.aleoChainId;
    const destTokenAddress = process.env.destTokenAddressWUSDC;
    const destTokenService = process.env.destTokenService;
    const min = process.env.minWUSDC;
    const max = process.env.maxWUSDC;

    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICEPROXY_ADDRESS;
    const ERC20TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, ERC20TokenServiceABI, deployerSigner);
    await TokenServiceContract.addToken(tokenAddress, destChainId, vault, destTokenAddress, destTokenService, min, max);
    console.log("USDC added successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });