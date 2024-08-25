import * as dotenv from "dotenv";
import hardhat from "hardhat";
const { ethers } = hardhat;
import Safe, { SafeFactory } from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { CreateCallAbi } from "../secondary_gnosis_proposal_scripts/ABI/ABI.js";
import { approveTransaction, executeTransaction, trimHexAddress, updateEnvFile } from "../utils.js";

dotenv.config();

// Initialize provider and signer
const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider("https://rpc2.sepolia.org");
const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);

// Prepare deployment
async function ProposeTransaction() {
    const BlackListService = await ethers.getContractFactory("BlackListService");
    const bytecode = BlackListService.bytecode;
    const deployerInterface = new ethers.utils.Interface(CreateCallAbi);
    const deployCallData = deployerInterface.encodeFunctionData("performCreate", [
        0,
        bytecode,
    ]);

    const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: deployerSigner,
    });

    const safeService = new SafeApiKit.default({
        txServiceUrl: "https://safe-transaction-sepolia.safe.global",
        ethAdapter,
    });

    // Transaction data
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

    // Propose the transaction
    await safeService.proposeTransaction(transactionConfig);

    return safeTxHash;
}

// Main function to approve, execute and deploy
(async () => {
    try {
        // Deploy and propose transaction
        const safeTxHash = await ProposeTransaction();
        const secondSigner = new ethers.Wallet(process.env.SECRET_KEY2, provider);
        const thirdSigner = new ethers.Wallet(process.env.SECRET_KEY3, provider);

        // Approve transaction (assuming a different signer if required for approval)
        await approveTransaction(
            safeTxHash,
            secondSigner, // or another signer if different from deployer
            SAFE_ADDRESS
        );
        await approveTransaction(
            safeTxHash,
            thirdSigner, // or another signer if different from deployer
            SAFE_ADDRESS
        );

        // Execute transaction
        const executor = new ethers.Wallet(process.env.SECRET_KEY4, provider);
        const executionReceipt = await executeTransaction(
            safeTxHash,
            executor, // Ensure the correct wallet address has permission to execute
            SAFE_ADDRESS
        );

        // Process the contract address from the logs
        const hexAddress = executionReceipt.logs[1].data;

        const trimmedAddress = trimHexAddress(hexAddress);

        // Write the Deployed Impl Contract to the .env file
        updateEnvFile('BLACKLISTSERVICEIMPLEMENTATION_ADDRESS', ethers.utils.getAddress(trimmedAddress));
        console.log("BLACKLISTSERVICEIMPLEMENTATION Contract Address:", ethers.utils.getAddress(trimmedAddress));
    } catch (error) {
        console.error("Error processing transaction:", error);
    }
})();
