import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const chainId = process.env.ethereumChainId;
    const destChainId = process.env.aleoChainId;

    const bridgeAddress = process.env.TOKENBRIDGEPROXY_ADDRESS;
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const TokenService = await ethers.getContractFactory("TokenService");

    const tokenServiceImpl = await TokenService.deploy();
    await tokenServiceImpl.deployed();
    console.log("TokenService Impl Deployed to: ", tokenServiceImpl.address);
    updateEnvFile("TOKENSERVICEIMPLEMENTATION_ADDRESS", tokenServiceImpl.address)

    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const initializeData = new ethers.utils.Interface(TokenService.interface.format()).encodeFunctionData("TokenService_init",
        [bridgeAddress, deployerSigner.address, chainId, destChainId, process.env.BLACKLISTSERVICEPROXY_ADDRESS]);

    const tokenServiceProxy = await ProxyContract.deploy(tokenServiceImpl.address, initializeData);
    await tokenServiceProxy.deployed();

    updateEnvFile("TOKENSERVICEPROXY_ADDRESS", tokenServiceProxy.address)
    console.log("TokenService Proxy Deployed to: ", tokenServiceProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });