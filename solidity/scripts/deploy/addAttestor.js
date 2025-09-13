import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    
    const attestor = process.env.ATTESTOR6;
    const newQuorumRequired = process.env.NEW_QUORUM_REQUIRED;

    // Get the contract factory for the "Bridge" contract
    const Bridge = await ethers.getContractFactory("BridgeV2", {
        libraries: {
            PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
            AleoAddressLibrary: process.env.ALEO_ADDRESS_LIBRARY,
        },
    });

    const tokenbridgeProxyAddress = process.env.TOKENBRIDGE_PROXY_ADDRESS;
    console.log("Adding Attestor");
    const BridgeABI = Bridge.interface.format();
    const BridgeContract = new ethers.Contract(tokenbridgeProxyAddress, BridgeABI, deployerSigner);
    await BridgeContract.addAttestor(attestor, newQuorumRequired);
    console.log("Attestor added successfully!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });