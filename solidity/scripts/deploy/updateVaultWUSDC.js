import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const tokenAddress = process.env.USDC_ADDR;
    const new_vault = process.env.ERC20VAULTSERVICE_PROXY_ADDRESS_USDC;
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    console.log("Updating Vault address for WUSDC...");
    const ERC20TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, ERC20TokenServiceABI, deployerSigner);
    await TokenServiceContract.updateVault(tokenAddress, new_vault);
    console.log("Vault updated successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });