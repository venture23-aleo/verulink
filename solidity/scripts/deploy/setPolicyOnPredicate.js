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

    const predicateservice = process.env.PREDICATE_SERVICE;
    console.log("Setting policy on PredicateService");
    const PredicateServiceABI = PredicateService.interface.format();
    const PredicateServiceContract = new ethers.Contract(predicateservice, PredicateServiceABI, deployerSigner);


    // await PredicateServiceContract.setPolicy("x-aleo-6a52de9724a6e8f2");
    await PredicateServiceContract.setPredicateManager("0xb4486F75129B0aa74F99b1B8B7b478Cd4c17e994");

    console.log("Policy set successfully!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });