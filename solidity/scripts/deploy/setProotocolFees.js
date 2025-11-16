import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    const feeCollector = await ethers.getContractFactory("FeeCollector");
    const feeCollectorProxyAddress = process.env.FEECOLLECTOR_PROXY_ADDRESS;
    console.log("Setting up the protocol fees...");
    const feeCollectorABI = feeCollector.interface.format();
    const FeeCollectorContract = new ethers.Contract(feeCollectorProxyAddress, feeCollectorABI, deployerSigner);
    await FeeCollectorContract.setPlatformFees(process.env.USDC_ADDR, 100);
    await FeeCollectorContract.setPrivatePlatformFees(process.env.USDC_ADDR, 150);

    await FeeCollectorContract.setPlatformFees(process.env.USDT_ADDR, 100);
    await FeeCollectorContract.setPrivatePlatformFees(process.env.USDT_ADDR, 150);

    // await FeeCollectorContract.setPlatformFees(process.env.WRAPPED_TOKEN_PROXY_ADDRESS, 100);
    // await FeeCollectorContract.setPrivatePlatformFees(process.env.USDT_ADDR, 233);

    await FeeCollectorContract.setPlatformFees(process.env.ONE_ADDRESS, 100);
    await FeeCollectorContract.setPrivatePlatformFees(process.env.ONE_ADDRESS, 150);
    console.log("Protocol fees updated successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });