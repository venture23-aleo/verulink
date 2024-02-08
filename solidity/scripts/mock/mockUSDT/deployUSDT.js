import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const MockUSDT = await ethers.getContractFactory("USDTMock");
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockUSDT with the account:", deployer.address);
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.deployed();
  console.log("MockUSDT Deployed to - ", mockUSDT.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });