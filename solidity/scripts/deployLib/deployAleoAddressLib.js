import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
  const AleoAddressLibrary = await ethers.getContractFactory("AleoAddressLibrary");
  console.log("Deploying AleoAddressLibrary: ");
  const aleoAddressLibrary = await AleoAddressLibrary.deploy();
  await aleoAddressLibrary.deployTransaction.wait(3);
  console.log("AleoAddressLibrary Deployed to:", aleoAddressLibrary.address);
  // Verification process
  console.log("Verifying AleoAddressLibrary contract...");
  await run("verify:verify", {
    address: aleoAddressLibrary.address,
    constructorArguments: [], // Pass the constructor arguments here
    contract: "contracts/common/libraries/AleoAddressLibrary.sol:AleoAddressLibrary"
  });
  updateEnvFile("ALEO_ADDRESS_LIBRARY", aleoAddressLibrary.address)
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });