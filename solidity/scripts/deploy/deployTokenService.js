import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const chainId = process.env.ETHEREUM_CHAINID;
    const destChainId = process.env.ALEO_CHAINID;

    const bridgeAddress = process.env.TOKENBRIDGE_PROXY_ADDRESS;
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const TokenService = await ethers.getContractFactory("TokenService");

    console.log("Deploying TokenService Impl and Proxy...");

    const tokenServiceImpl = await TokenService.deploy();
    await tokenServiceImpl.deployTransaction.wait(3);
    console.log("TokenService Impl Deployed to: ", tokenServiceImpl.address);
    // Verification process
    console.log("Verifying impl contract...");
    await run("verify:verify", {
        address: tokenServiceImpl.address,
        constructorArguments: [], // Pass the constructor arguments here
        contract: "contracts/main/tokenservice/TokenService.sol:TokenService"
    });
    updateEnvFile("TOKENSERVICE_IMPLEMENTATION_ADDRESS", tokenServiceImpl.address)

    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const initializeData = new ethers.utils.Interface(TokenService.interface.format()).encodeFunctionData("TokenService_init",
        [bridgeAddress, deployerSigner.address, chainId, destChainId, process.env.BLACKLISTSERVICE_PROXY_ADDRESS]);

    const tokenServiceProxy = await ProxyContract.deploy(tokenServiceImpl.address, initializeData);
    await tokenServiceProxy.deployTransaction.wait(3);

    console.log("TokenService Proxy Deployed to: ", tokenServiceProxy.address);
    console.log("Verifying proxy contract...");

    await run("verify:verify", {
        address: tokenServiceProxy.address,
        constructorArguments: [tokenServiceImpl.address, initializeData], // Pass the constructor arguments here
        contract: "contracts/proxies/Proxy.sol:ProxyContract"
    });
    updateEnvFile("TOKENSERVICE_PROXY_ADDRESS", tokenServiceProxy.address)
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });