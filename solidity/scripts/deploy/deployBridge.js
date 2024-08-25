import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );

    const destChainId = "6694886634403";
    const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const Bridge = await ethers.getContractFactory("Bridge", {
        libraries: {
            PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
            AleoAddressLibrary: process.env.AleoAddressLibrary,
        },
    });
    
    const bridgeImpl = await Bridge.deploy();
    await bridgeImpl.deployed();
    console.log("Bridge Impl Deployed to: ", bridgeImpl.address);
    updateEnvFile("TOKENBRIDGEIMPLEMENTATION_ADDRESS", bridgeImpl.address)
    const ProxyContract = await ethers.getContractFactory("ProxyContract");

    const initializeData = new ethers.utils.Interface(Bridge.interface.format()).encodeFunctionData("Bridge_init", [destChainId, deployerSigner.address]);

    const bridgeProxy = await ProxyContract.deploy(bridgeImpl.address, initializeData);
    await bridgeProxy.deployed();
    const BridgeABI = Bridge.interface.format();
    const BridgeCotract = new ethers.Contract(bridgeProxy.address, BridgeABI, deployerSigner);
    await BridgeCotract.transferOwnership(SAFE_ADDRESS);
    updateEnvFile("TOKENBRIDGEPROXY_ADDRESS", bridgeProxy.address)
    console.log("Bridge Proxy Deployed to: ", bridgeProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });