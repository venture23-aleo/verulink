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
    const PredicateService = await ethers.getContractFactory("PredicateService");

    console.log("Deploying PredicateService...");

    const predicateservice = await PredicateService.deploy();
    await predicateservice.deployTransaction.wait(1);
    console.log("PredicateService Deployed to: ", predicateservice.address);
    // // Verification process
    // console.log("Verifying PredicateService contract...");
    // await run("verify:verify", {
    //     address: predicateservice.address,
    //     constructorArguments: [], // Pass the constructor arguments here
    //     contract: "contracts/main/tokenservice/PredicateService/PredicateService.sol"
    // });
    updateEnvFile("PREDICATE_SERVICE", predicateservice.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });