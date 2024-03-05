import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );

    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const Holding = await ethers.getContractFactory("Holding")
    console.log("Deploying Holding Impl with the account:", deployerSigner.address);
    const holdingImpl = await Holding.deploy();
    await holdingImpl.deployed();
    console.log("Holding Impl Deployed to: ", holdingImpl.address);
    console.log("Deploying Holding Proxy with the account:", deployerSigner.address);
    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const initializeData = new ethers.utils.Interface(Holding.interface.format()).encodeFunctionData("Holding_init", [process.env.TOKENSERVICEPROXY_ADDRESS]);

    const holdingProxy = await ProxyContract.deploy(holdingImpl.address, initializeData);
    await holdingProxy.deployed();
    console.log("Holding Proxy Deployed to: ", holdingProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });