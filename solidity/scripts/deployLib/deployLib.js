import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const PacketLibrary = await ethers.getContractFactory("PacketLibrary");
  const [deployer] = await ethers.getSigners();
  console.log("Deploying PacketLibrary with the account:", deployer.address);
  const packetLibrary = await PacketLibrary.deploy();
  await packetLibrary.deployed();
  console.log("PacketLibrary Deployed to - ", packetLibrary.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });