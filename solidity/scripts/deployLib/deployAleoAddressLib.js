import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
  const AleoAddressLibrary = await ethers.getContractFactory("AleoAddressLibrary");
  const aleoAddressLibrary = await AleoAddressLibrary.deploy();
  await aleoAddressLibrary.deployed();
  updateEnvFile("ALEO_ADDRESS_LIBRARY", aleoAddressLibrary.address)
  console.log("AleoAddressLibrary Deployed to:", aleoAddressLibrary.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });