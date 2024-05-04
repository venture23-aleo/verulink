import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const AleoAddressLibrary = await ethers.getContractFactory("AleoAddressLibrary");
  const [deployer] = await ethers.getSigners();
  console.log("Deploying AleoAddressLibrary with the account:", deployer.address);
  const aleoAddressLibrary = await AleoAddressLibrary.deploy();
  await aleoAddressLibrary.deployed();
  console.log("AleoAddressLibrary Deployed to - ", aleoAddressLibrary.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });