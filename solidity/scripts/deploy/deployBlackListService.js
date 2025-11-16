import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();
import { updateEnvFile } from "../multisig/utils.js";

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    const usdc = process.env.USDC_ADDR;
    const usdt = process.env.USDT_ADDR;

    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const BlackListService = await ethers.getContractFactory("BlackListService");

    console.log("Deploying BlacklistService Impl and Proxy...");

    // const blackListServiceImpl = await BlackListService.deploy();
    // await blackListServiceImpl.deployTransaction.wait(3);
    // console.log("BlackListService Impl Deployed to: ", blackListServiceImpl.address);
    // updateEnvFile("BLACKLISTSERVICE_IMPLEMENTATION_ADDRESS", blackListServiceImpl.address)
    // // Verification process
    // console.log("Verifying impl contract...");
    // await run("verify:verify", {
    //     address: blackListServiceImpl.address,
    //     constructorArguments: [], // Pass the constructor arguments here
    //     contract: "contracts/main/tokenservice/BlackListService.sol:BlackListService"
    // });

    const blackListServiceImplAddress = process.env.BLACKLISTSERVICE_IMPLEMENTATION_ADDRESS;

    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData("BlackList_init", [usdc, usdt, deployerSigner.address]);

    const blackListServiceProxy = await ProxyContract.deploy(blackListServiceImplAddress, initializeData);
    await blackListServiceProxy.deployTransaction.wait(3);
    console.log("BlackListService Proxy Deployed to: ", blackListServiceProxy.address);
    console.log("Verifying proxy contract...");

    await run("verify:verify", {
        address: blackListServiceProxy.address,
        constructorArguments: [blackListServiceImplAddress, initializeData], // Pass the constructor arguments here
        contract: "contracts/proxies/Proxy.sol:ProxyContract"
    });

    updateEnvFile("BLACKLISTSERVICE_PROXY_ADDRESS", blackListServiceProxy.address)
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });