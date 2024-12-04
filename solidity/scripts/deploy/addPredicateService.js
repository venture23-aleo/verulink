import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const ERC20TokenServiceV2 = await ethers.getContractFactory("TokenServiceV2");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    console.log("deployerSigner= ", deployerSigner.address);
    
    console.log("Adding PredicateService to tokenservice...");
    const ERC20TokenServiceABI = ERC20TokenServiceV2.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, ERC20TokenServiceABI, deployerSigner);
    // await TokenServiceContract.connect(deployerSigner).setPredicateService(process.env.PREDICATE_SERVICE);
    console.log("PredicateService added successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });