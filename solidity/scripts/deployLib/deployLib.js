import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
  const PacketLibrary = await ethers.getContractFactory("PacketLibrary");
  console.log("Deploying PacketLibrary: ");
  const packetLibrary = await PacketLibrary.deploy();
  await packetLibrary.deployTransaction.wait(3);
  
  updateEnvFile("PACKET_LIBRARY_CONTRACT_ADDRESS", packetLibrary.address)
  console.log("PacketLibrary Deployed to:", packetLibrary.address);
  // Verification process
  console.log("Verifying PacketLibrary contract...");
  await run("verify:verify", {
    address: packetLibrary.address,
    constructorArguments: [], // Pass the constructor arguments here
    contract: "contracts/common/libraries/PacketLibrary.sol:PacketLibrary"
  });
  
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });