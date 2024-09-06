import * as dotenv from "dotenv";
import hardhat from "hardhat";
const { ethers } = hardhat;
import Safe from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { CreateCallAbi } from "../secondary_gnosis_proposal_scripts/ABI/ABI.js";
import { approveTransaction, executeTransaction, trimHexAddress, updateEnvFile } from "../utils.js";

dotenv.config();

const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(
    process.env.PROVIDER
);
const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);

async function ProposeProxyTransaction() {
    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const bytecode = ProxyContract.bytecode;
    const HoldingImpl = await ethers.getContractFactory("Holding");
    const owner = process.env.SAFE_ADDRESS;
    const tokenservice = process.env.TOKENSERVICEPROXY_ADDRESS;
    const holdingimplementationAddress = process.env.HOLDINGIMPLEMENTATION_ADDRESS;

    const initializeData = new ethers.utils.Interface(HoldingImpl.interface.format()).encodeFunctionData("Holding_init", [tokenservice, owner]);
    const _data = new ethers.utils.AbiCoder().encode(["address", "bytes"], [holdingimplementationAddress, initializeData]);

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

(async () => {
    try {
        const safeTxHash = await ProposeProxyTransaction();

        // Approve transaction using additional signers
        const secondSigner = new ethers.Wallet(process.env.SECRET_KEY2, provider);
        const thirdSigner = new ethers.Wallet(process.env.SECRET_KEY3, provider);

        await approveTransaction(safeTxHash, secondSigner, SAFE_ADDRESS);
        await approveTransaction(safeTxHash, thirdSigner, SAFE_ADDRESS);

        // Execute transaction
        const executor = new ethers.Wallet(process.env.SECRET_KEY4, provider);
        const executionReceipt = await executeTransaction(safeTxHash, executor, SAFE_ADDRESS);

        // Process the contract address from the logs
        const hexAddress = executionReceipt.logs[5].data; // Adjust index based on actual logs
        const trimmedAddress = trimHexAddress(hexAddress);

        // Update the .env file with the new contract address
        updateEnvFile("HOLDINGPROXY_ADDRESS", ethers.utils.getAddress(trimmedAddress));
        console.log("HOLDINGPROXY Contract Address:", ethers.utils.getAddress(trimmedAddress));
    } catch (error) {
        console.error("Error processing transaction:", error);
    }
})();
