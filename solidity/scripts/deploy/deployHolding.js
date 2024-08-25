import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );

    const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const Holding = await ethers.getContractFactory("Holding")

    const holdingImpl = await Holding.deploy();
    await holdingImpl.deployed();
    updateEnvFile("HOLDINGIMPLEMENTATION_ADDRESS", holdingImpl.address);
    console.log("Holding Impl Deployed to: ", holdingImpl.address);

    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    
    const initializeData = new ethers.utils.Interface(Holding.interface.format()).encodeFunctionData("Holding_init", [process.env.TOKENSERVICEPROXY_ADDRESS, deployerSigner.address]);
    const holdingProxy = await ProxyContract.deploy(holdingImpl.address, initializeData);
    await holdingProxy.deployed();

    const HoldingABI = Holding.interface.format();
    const HoldingContract = new ethers.Contract(holdingProxy.address, HoldingABI, deployerSigner);
    await HoldingContract.transferOwnership(SAFE_ADDRESS);

    updateEnvFile("HOLDINGPROXY_ADDRESS", holdingProxy.address);
    console.log("Holding Proxy Deployed to: ", holdingProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });