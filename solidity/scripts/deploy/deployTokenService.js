import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );
    const chainId = "28556963657430695";
    const destChainId = "6694886634403";
    const bridgeAddress = process.env.TOKENBRIDGEPROXY_ADDRESS;
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const TokenService = await ethers.getContractFactory("TokenService");
    console.log("Deploying TokenService Impl with the account:", deployerSigner.address);
    const tokenServiceImpl = await TokenService.deploy();
    await tokenServiceImpl.deployed();
    console.log("TokenService Impl Deployed to: ", tokenServiceImpl.address);
    console.log("Deploying TokenService Proxy with the account:", deployerSigner.address);
    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const initializeData = new ethers.utils.Interface(TokenService.interface.format()).encodeFunctionData("TokenService_init(address,uint256,uint256,address)",
        [bridgeAddress, chainId, destChainId, process.env.BLACKLISTSERVICEPROXY_ADDRESS]);

    const tokenServiceProxy = await ProxyContract.deploy(tokenServiceImpl.address, initializeData);
    await tokenServiceProxy.deployed();
    console.log("TokenService Proxy Deployed to: ", tokenServiceProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });