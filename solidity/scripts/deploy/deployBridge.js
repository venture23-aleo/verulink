import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );

    const destChainId = "6694886634403";
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const Bridge = await ethers.getContractFactory("Bridge", {
        libraries: {
            PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
        },
    });
    console.log("Deploying Bridge Impl with the account:", deployerSigner.address);
    const bridgeImpl = await Bridge.deploy();
    await bridgeImpl.deployed();
    console.log("Bridge Impl Deployed to: ", bridgeImpl.address);
    console.log("Deploying Bridge Proxy with the account:", deployerSigner.address);
    const ProxyContract = await ethers.getContractFactory("ProxyContract");

    const initializeData = new ethers.utils.Interface(Bridge.interface.format()).encodeFunctionData("Bridge_init", [destChainId]);

    const tokenServiceProxy = await ProxyContract.deploy(bridgeImpl.address, initializeData);
    await tokenServiceProxy.deployed();
    console.log("Bridge Proxy Deployed to: ", tokenServiceProxy.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });