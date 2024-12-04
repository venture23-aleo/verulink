import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const SERVICE_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SERVICE_ROLE"));
    const tokenServiceProxy = process.env.TOKENSERVICE_PROXY_ADDRESS;

    // Get the contract factory for the "PredicateService" contract
    const PredicateService = await ethers.getContractFactory("PredicateService");

    const predicateservice = process.env.PREDICATE_SERVICE;
    console.log("Granting service role to tokenservice");
    const PredicateServiceABI = PredicateService.interface.format();
    const PredicateServiceContract = new ethers.Contract(predicateservice, PredicateServiceABI, deployerSigner);
    await PredicateServiceContract.grantRole(SERVICE_ROLE, tokenServiceProxy);
    console.log("Role granted successfully!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });