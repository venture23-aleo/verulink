import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    const usdcToken = process.env.USDC_ADDR;
    const usdtToken = process.env.USDT_ADDR;
    const ethToken = process.env.ONE_ADDRESS;

    const vaultAddress = process.env.VAULT_ADDRESS;

    const ERC20TokenService = await ethers.getContractFactory("TokenServiceV2");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);

    console.log("Updating vault address for USDC");
    await TokenServiceContract.updateVault(usdcToken, vaultAddress );

    console.log("Updating vault address for USDT");
    await TokenServiceContract.updateVault(usdtToken, vaultAddress);

    console.log("Updating vault address for ETH");
    await TokenServiceContract.updateVault(ethToken, vaultAddress);

    console.log("Vault address updated successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });