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

    const pauserAddress = deployerSigner.address;
    const ownerAddress = deployerSigner.address;
    const tokenName = "Verulink Aleo";
    const tokenSymbol = "vAleo";
    const minterAddress = process.env.WRAPPED_TOKENSERVICE_PROXY_ADDRESS;

    const WrappedToken = await ethers.getContractFactory("WrappedTokens");

    console.log("Deploying WrappedToken Impl and Proxy...");

    const wrappedTokenImpl = await WrappedToken.deploy();
    await wrappedTokenImpl.deployTransaction.wait(3);
    console.log("WrappedToken Impl Deployed to: ", wrappedTokenImpl.address);
    console.log("Verifying impl contract...");
    await run("verify:verify", {
        address: wrappedTokenImpl.address,
        constructorArguments: [], // Pass the constructor arguments here
        contract: "contracts/main/tokens/wrappedTokens.sol:WrappedTokens"
    });
    updateEnvFile("WRAPPED_TOKEN_IMPLEMENTATION_ADDRESS", wrappedTokenImpl.address);

    const ProxyContract = await ethers.getContractFactory("ProxyContract");

    const initializeData = new ethers.utils.Interface(WrappedToken.interface.format()).encodeFunctionData("initialize", [tokenName, tokenSymbol, ownerAddress, pauserAddress, minterAddress]);
    const wrappedTokenProxy = await ProxyContract.deploy(wrappedTokenImpl.address, initializeData);
    await wrappedTokenProxy.deployTransaction.wait(3);

    console.log("WrappedToken Proxy Deployed to: ", wrappedTokenProxy.address);
    console.log("Verifying proxy contract...");

    await run("verify:verify", {
        address: wrappedTokenProxy.address,
        constructorArguments: [wrappedTokenImpl.address, initializeData], // Pass the constructor arguments here
        contract: "contracts/proxies/Proxy.sol:ProxyContract"
    });
    updateEnvFile("WRAPPED_TOKEN_PROXY_ADDRESS", wrappedTokenProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });