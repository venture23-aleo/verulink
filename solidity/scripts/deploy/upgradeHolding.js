import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    const Holding = await ethers.getContractFactory("Holding");

    console.log("Deploying Holding Impl and Proxy...");

    const holdingImpl = await Holding.deploy();
    await holdingImpl.deployTransaction.wait(3);
    console.log("Holding Impl Deployed to: ", holdingImpl.address);
    // Verification process
    console.log("Verifying impl contract...");
    await run("verify:verify", {
        address: holdingImpl.address,
        constructorArguments: [], // Pass the constructor arguments here
        contract: "contracts/main/Holding.sol:Holding"
    });
    updateEnvFile("HOLDING_NEW_IMPLEMENTATION_ADDRESS", holdingImpl.address)

    const holdingProxyAddress = process.env.HOLDING_PROXY_ADDRESS;
    console.log("Upgrading Holding Implementation...");
    const HoldingABI = Holding.interface.format();
    const HoldingContract = new ethers.Contract(holdingProxyAddress, HoldingABI, deployerSigner);
    await HoldingContract.upgradeTo(holdingImpl.address);
    console.log("Holding Implementation upgraded successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });