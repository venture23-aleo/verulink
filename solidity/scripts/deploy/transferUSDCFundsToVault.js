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
    const usdcTokenAddress = await ethers.getContractFactory("USDCMock");
    const usdcTokenContract = new ethers.Contract(usdcToken, usdcTokenAddress.interface.format(), deployerSigner);

    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);

    console.log("Transfering USDC to vault Address...");
    const usdcBalance = await usdcTokenContract.balanceOf(tokenServiceProxyAddress);
    console.log("USDC BALANCE: ", usdcBalance);
    await TokenServiceContract.transferToVault(usdcToken, usdcBalance);

    console.log("Transferred to USDC Vault successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });