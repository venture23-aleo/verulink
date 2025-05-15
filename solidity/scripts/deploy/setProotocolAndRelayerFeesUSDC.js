import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const publicProtocolFees = 100;
    const privateProtocolFees = 175;
    const tokenAddress = process.env.USDC_ADDR;
    const tokenService = await ethers.getContractFactory("TokenServiceV3");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    console.log("Setting up the protocol fees...");
    const tokenServiceABI = tokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, tokenServiceABI, deployerSigner);
    await TokenServiceContract.setPlatformFees(tokenAddress, publicProtocolFees, privateProtocolFees);
    console.log("Protocol fees updated successfully!!!");

    console.log("Setting up the relayerFees...");
    const relayerFees = 500000;
    await TokenServiceContract.setExecutorFees(tokenAddress, relayerFees);
    console.log("Relayer Fees updated!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });