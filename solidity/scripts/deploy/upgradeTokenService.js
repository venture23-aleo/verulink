import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    const TokenService = await ethers.getContractFactory("TokenService");

    console.log("Deploying TokenService New Impl...");

    const tokenServiceImpl = await TokenService.deploy();
    await tokenServiceImpl.deployTransaction.wait(3);
    console.log("TokenService Implementation Deployed to: ", tokenServiceImpl.address);
    // Verification process
    console.log("Verifying impl contract...");
    await run("verify:verify", {
        address: tokenServiceImpl.address,
        constructorArguments: [],
        contract: "contracts/main/tokenservice/TokenService.sol:TokenService"
    });
    updateEnvFile("TOKENSERVICE_NEW_IMPLEMENTATION_ADDRESS", tokenServiceImpl.address);

    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    console.log("Upgrading TokenService Implementation...");
    const ERC20TokenServiceABI = TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, ERC20TokenServiceABI, deployerSigner);
    await TokenServiceContract.upgradeTo(tokenServiceImpl.address);
    console.log("TokenService Implementation upgraded successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });