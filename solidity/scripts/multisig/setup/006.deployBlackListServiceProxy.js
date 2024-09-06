import * as dotenv from "dotenv";
import hardhat from 'hardhat';
const { ethers } = hardhat;
import Safe, { SafeFactory } from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { CreateCallAbi } from "../secondary_gnosis_proposal_scripts/ABI/ABI.js";
import { approveTransaction, executeTransaction, trimHexAddress, updateEnvFile } from "../utils.js";

dotenv.config();

// Initialize provider and signer
const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(
    process.env.PROVIDER
);
const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);

async function ProposeTransaction() {
    const BlackListService = await ethers.getContractFactory("BlackListService");
    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const bytecode = ProxyContract.bytecode;

    const owner = process.env.SAFE_ADDRESS;
    const usdcAddress = process.env.USDC_ADDR;
    const usdtAddress = process.env.USDT_ADDR;

    const blacklistserviceimplementationAddress = process.env.BLACKLISTSERVICEIMPLEMENTATION_ADDRESS;
    const initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData("BlackList_init", [usdcAddress, usdtAddress, owner]);

    const _data = new ethers.utils.AbiCoder().encode(["address", "bytes"], [blacklistserviceimplementationAddress, initializeData]);

    // Encode deployment
    const deployerInterface = new ethers.utils.Interface(CreateCallAbi);
    const deployCallData = deployerInterface.encodeFunctionData("performCreate", [
        0,
        bytecode + _data.slice(2)
    ]);

    const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: deployerSigner,
    });

    const safeService = new SafeApiKit.default({
        txServiceUrl: process.env.txServiceUrl,
        ethAdapter,
    });

    const txData = {
        to: process.env.CREATECALL_CONTRACT_ADDRESS,
        value: "0",
        data: deployCallData,
    };

    const safeSdk = await Safe.default.create({
        ethAdapter: ethAdapter,
        safeAddress: SAFE_ADDRESS,
    });

    const safeTx = await safeSdk.createTransaction({
        safeTransactionData: txData,
    });

    const safeTxHash = await safeSdk.getTransactionHash(safeTx);
    const signature = await safeSdk.signTypedData(safeTx);

    const transactionConfig = {
        safeAddress: SAFE_ADDRESS,
        safeTransactionData: safeTx.data,
        safeTxHash: safeTxHash,
        senderAddress: process.env.SENDER_ADDRESS,
        senderSignature: signature.data,
    };

    await safeService.proposeTransaction(transactionConfig);

    return safeTxHash;
}

// Main function to deploy, approve, execute, and handle results
(async () => {
    try {
        // Deploy and propose transaction
        const safeTxHash = await ProposeTransaction();
        const secondSigner = new ethers.Wallet(process.env.SECRET_KEY2, provider);
        const thirdSigner = new ethers.Wallet(process.env.SECRET_KEY3, provider);

        // Approve transaction (assuming a different signer if required for approval)
        await approveTransaction(
            safeTxHash,
            secondSigner,
            SAFE_ADDRESS
        );
        await approveTransaction(
            safeTxHash,
            thirdSigner,
            SAFE_ADDRESS
        );

        // Execute transaction
        const executor = new ethers.Wallet(process.env.SECRET_KEY4, provider);
        const executionReceipt = await executeTransaction(
            safeTxHash,
            executor,
            SAFE_ADDRESS
        );

        // Process the contract address from the logs
        const hexAddress = executionReceipt.logs[5].data;
        // console.log("executionReceipt = ", executionReceipt);

        const trimmedAddress = trimHexAddress(hexAddress);

        // Write the Deployed Proxy Contract to the .env file
        updateEnvFile('BLACKLISTSERVICEPROXY_ADDRESS', ethers.utils.getAddress(trimmedAddress));
        console.log("BLACKLISTSERVICEPROXY Contract Address:", ethers.utils.getAddress(trimmedAddress));
    } catch (error) {
        console.error("Error processing transaction:", error);
    }
})();
