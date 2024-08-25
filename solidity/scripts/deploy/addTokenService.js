import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const tokenServiceProxy = process.env.TOKENSERVICEPROXY_ADDRESS;
    const Bridge = await ethers.getContractFactory("Bridge", {
        libraries: {
            PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
            AleoAddressLibrary: process.env.AleoAddressLibrary,
        },
    });
    const bridgeProxy = process.env.TOKENBRIDGEPROXY_ADDRESS;
    const BridgeABI = Bridge.interface.format();
    const BridgeContract = new ethers.Contract(bridgeProxy, BridgeABI, deployerSigner);
    await BridgeContract.addTokenService(tokenServiceProxy);
    console.log("TokenService Succefully added!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });