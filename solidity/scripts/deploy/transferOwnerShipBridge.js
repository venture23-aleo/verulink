import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const newOwner = new ethers.Wallet(process.env.SECRET_KEY5, provider);
    const Bridge = await ethers.getContractFactory("Bridge", {
        libraries: {
            PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
        },
    });
    const bridgeProxy = process.env.TOKENBRIDGEPROXY_ADDRESS;
    let BridgeABI = Bridge.interface.format();
    const BridgeCotract = new ethers.Contract(bridgeProxy, BridgeABI, deployerSigner);
    console.log("Transferring Ownership to = ", newOwner.address);
    await BridgeCotract.transferOwnership(newOwner.address);
    console.log("BridgeCotract New Owner = ", await BridgeCotract.owner());
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });