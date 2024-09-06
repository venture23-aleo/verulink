import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const newOwner = process.env.SAFE_ADDRESS;
    const Bridge = await ethers.getContractFactory("Bridge", {
        libraries: {
            PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
            AleoAddressLibrary: process.env.AleoAddressLibrary,
        },
    });

    const bridgeProxy = process.env.TOKENBRIDGEPROXY_ADDRESS;
    console.log("Transferring Ownership of Bridge to = ", newOwner);
    const BridgeABI = Bridge.interface.format();
    const BridgeCotract = new ethers.Contract(bridgeProxy, BridgeABI, deployerSigner);
    await BridgeCotract.transferOwnership(newOwner);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });