import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );

    const addr = process.env.ATTESTOR3;
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const Bridge = await ethers.getContractFactory("Bridge", {
        libraries: {
            PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
            AleoAddressLibrary: process.env.AleoAddressLibrary,
        },
    });
    const bridgeProxyAddress = process.env.TOKENBRIDGEPROXY_ADDRESS;
    const BridgeABI = Bridge.interface.format();
    const BridgeContract = new ethers.Contract(bridgeProxyAddress, BridgeABI, deployerSigner);
    console.log(await BridgeContract.isAttestor(addr));
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });