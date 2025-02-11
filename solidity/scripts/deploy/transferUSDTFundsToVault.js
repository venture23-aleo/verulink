import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    const usdtToken = process.env.USDT_ADDR;
    const usdtTokenAddress = await ethers.getContractFactory("USDTMock");
    const usdtTokenContract = new ethers.Contract(usdtToken, usdtTokenAddress.interface.format(), deployerSigner);

    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);

    console.log("Transfering USDT to vault Address...");
    const usdtBalance = await usdtTokenContract.balanceOf(tokenServiceProxyAddress);
    console.log("USDT BALANCE: ", usdtBalance);
    await TokenServiceContract.transferToVault(usdtToken, usdtBalance);

    console.log("Transferred to USDT Vault successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });