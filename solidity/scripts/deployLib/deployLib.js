import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://rpc2.sepolia.org"
  );
  const PacketLibrary = await ethers.getContractFactory("PacketLibrary");
  const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
  const packetLibrary = await PacketLibrary.deploy();
  await packetLibrary.deployed();
  updateEnvFile("PACKET_LIBRARY_CONTRACT_ADDRESS", packetLibrary.address)
  console.log("PacketLibrary Deployed to:", packetLibrary.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });