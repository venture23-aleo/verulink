import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const tokenAddress = process.env.USDC_ADDR;
    const vault = process.env.ERC20VAULTSERVICE_PROXY_ADDRESS_USDC;
    const destChainId = process.env.ALEO_CHAINID;
    const destTokenAddress = process.env.DEST_TOKEN_ADDRESS_WUSDC;
    const destTokenService = process.env.DEST_TOKENSERVICE;
    const min = process.env.MIN_WUSDC;
    const max = process.env.MAX_WUSDC;

    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    console.log("Adding USDC to tokenservice...");
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);
    await TokenServiceContract.addToken(tokenAddress, destChainId, vault, destTokenAddress, destTokenService, min, max);
    console.log("USDC added successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });