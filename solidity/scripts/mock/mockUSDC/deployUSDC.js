import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const MockUSDC = await ethers.getContractFactory("USDCMock");
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockUSDC with the account:", deployer.address);
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.deployed();
  console.log("MockUSDC Deployed to - ", mockUSDC.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });