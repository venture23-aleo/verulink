import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );
    const chainId = "28556963657430695";
    const destChainId = "6694886634403";

    const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
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
    const TokenServiceABI = TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxy.address, TokenServiceABI, deployerSigner);
    await TokenServiceContract.transferOwnership(SAFE_ADDRESS);
    
    updateEnvFile("TOKENSERVICEPROXY_ADDRESS", tokenServiceProxy.address)
    console.log("TokenService Proxy Deployed to: ", tokenServiceProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });