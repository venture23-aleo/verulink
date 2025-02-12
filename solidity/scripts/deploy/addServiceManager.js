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
    const servicemanager = "0x4FC1132230fE16f67531D82ACbB9d78993B23825";
    const predicateservice = process.env.PREDICATE_SERVICE;
    console.log("Adding ServiceManager to PredicateService");
    const PredicateServiceABI = PredicateService.interface.format();
    const PredicateServiceContract = new ethers.Contract(predicateservice, PredicateServiceABI, deployerSigner);
    await PredicateServiceContract.setPredicateManager(servicemanager);
    console.log("ServiceManager added successfully!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });