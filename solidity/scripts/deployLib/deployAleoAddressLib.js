import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://rpc2.sepolia.org"
  );
  const AleoAddressLibrary = await ethers.getContractFactory("AleoAddressLibrary");
  const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
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