import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    // Get the contract factory for the "PredicateService" contract
    const PredicateService = await ethers.getContractFactory("PredicateService");
    const policyid = "sg-policy-membership-multi-op";
    const predicateservice = process.env.PREDICATE_SERVICE;
    console.log("Adding policyId to PredicateService");
    const PredicateServiceABI = PredicateService.interface.format();
    const PredicateServiceContract = new ethers.Contract(predicateservice, PredicateServiceABI, deployerSigner);
    await PredicateServiceContract.setPolicy(policyid);
    console.log("policyId added successfully!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });