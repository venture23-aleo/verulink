import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    const ethTokenAddress = process.env.ONE_ADDRESS;

    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);

    console.log("Transfering ETH to vault Address...");
    const ethBalance = await provider.getBalance(tokenServiceProxyAddress);
    console.log("ETH available BALANCE: ", ethBalance);
    await TokenServiceContract.transferToVault(ethTokenAddress, ethBalance);

    console.log("Transferred to ETH Vault successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });