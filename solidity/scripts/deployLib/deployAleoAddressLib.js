import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.PROVIDER
);
  const AleoAddressLibrary = await ethers.getContractFactory("AleoAddressLibrary");
  const aleoAddressLibrary = await AleoAddressLibrary.deploy();
  await aleoAddressLibrary.deployed();
  updateEnvFile("AleoAddressLibrary", aleoAddressLibrary.address)
  console.log("AleoAddressLibrary Deployed to:", aleoAddressLibrary.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });