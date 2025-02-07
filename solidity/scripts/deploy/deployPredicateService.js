import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    let serviceManager = "0x4FC1132230fE16f67531D82ACbB9d78993B23825";
    let policyId = "sg-policy-membership-multi-op";
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const PredicateService = await ethers.getContractFactory("PredicateService");

    console.log("Deploying PredicateService...");

    const predicateservice = await PredicateService.deploy(serviceManager, policyId);
    await predicateservice.deployTransaction.wait(3);
    console.log("PredicateService Deployed to: ", predicateservice.address);
    // Verification process
    console.log("Verifying PredicateService contract...");
    await run("verify:verify", {
        address: predicateservice.address,
        constructorArguments: [serviceManager,policyId], // Pass the constructor arguments here
        contract: "contracts/main/tokenservice/predicate/PredicateService.sol:PredicateService"
    });
    updateEnvFile("PREDICATE_SERVICE", predicateservice.address);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });