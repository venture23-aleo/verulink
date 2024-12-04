import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    const TokenService = await ethers.getContractFactory("TokenService");

    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    const tokenservicenewimpl = process.env.TOKENSERVICE_NEW_IMPLEMENTATION_ADDRESS
    console.log("Upgrading TokenService Implementation...");
    const ERC20TokenServiceABI = TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, ERC20TokenServiceABI, deployerSigner);
    await TokenServiceContract.upgradeTo(tokenservicenewimpl);
    console.log("TokenService Implementation upgraded successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });