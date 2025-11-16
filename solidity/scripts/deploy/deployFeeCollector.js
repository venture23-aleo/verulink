import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const usdcToken = process.env.USDC_ADDR;
    const usdtToken = process.env.USDT_ADDR;

    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const FeeCollector = await ethers.getContractFactory("FeeCollector");

    console.log("Deploying FeeCollector Impl and Proxy...");

    const feeCollectorImpl = await FeeCollector.deploy();
    await feeCollectorImpl.deployTransaction.wait(2);
    updateEnvFile("FEECOLLECTOR_IMPLEMENTATION_ADDRESS", feeCollectorImpl.address);
    console.log("FeeCollector Impl Deployed to: ", feeCollectorImpl.address);
    // Verification process
    console.log("Verifying impl contract...");
    console.log({
            name: "Fee Collector Implementation",
            address: feeCollectorImpl.address,
            contract: "contracts/main/tokenservice/FeeCollector.sol:FeeCollector",
            constructorArgs: []
        })

    const feeCollectorImplAddress = process.env.FEECOLLECTOR_IMPLEMENTATION_ADDRESS;
    

    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const initializeData = new ethers.utils.Interface(FeeCollector.interface.format()).encodeFunctionData("initialize",
        [process.env.TOKENSERVICE_PROXY_ADDRESS, deployerSigner.address, usdcToken, usdtToken]);

    const feeCollectorProxy = await ProxyContract.deploy(feeCollectorImpl.address, initializeData);
    await feeCollectorProxy.deployTransaction.wait(2);

    updateEnvFile("FEECOLLECTOR_PROXY_ADDRESS", feeCollectorProxy.address)
    console.log("FeeCollector Proxy Deployed to: ", feeCollectorProxy.address);
    console.log("Verifying proxy contract...");

    await run("verify:verify", {
        address: feeCollectorProxy.address,
        constructorArguments: [feeCollectorImpl.address, initializeData], // Pass the constructor arguments here
        contract: "contracts/proxies/Proxy.sol:ProxyContract"
    });
    
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });