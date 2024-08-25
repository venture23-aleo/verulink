import * as dotenv from "dotenv";
import hardhat from "hardhat";
import Safe from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { CreateCallAbi } from "../secondary_gnosis_proposal_scripts/ABI/ABI.js";
import { approveTransaction, executeTransaction, trimHexAddress, updateEnvFile } from "../utils.js";

dotenv.config();

const { ethers } = hardhat;

// Initialize provider and signer
const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider("https://rpc2.sepolia.org");
const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);

async function ProposeTransaction() {
    const ERC20TokenbridgeImpl = await ethers.getContractFactory("Bridge", {
        libraries: {
            PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
            AleoAddressLibrary: process.env.AleoAddressLibrary,
        },
    });

    const bytecode = ERC20TokenbridgeImpl.bytecode;

    // Encode deployment
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
        const hexAddress = executionReceipt.logs[1].data;
        const trimmedAddress = trimHexAddress(hexAddress);
        updateEnvFile("TOKENBRIDGEIMPLEMENTATION_ADDRESS", ethers.utils.getAddress(trimmedAddress));
        console.log("TokenbridgeImpl Contract Address:", ethers.utils.getAddress(trimmedAddress));
    } catch (error) {
        console.error("Error processing transaction:", error);
    }
})();
