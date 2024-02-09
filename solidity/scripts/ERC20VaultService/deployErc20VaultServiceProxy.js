import * as dotenv from "dotenv";
import hardhat from 'hardhat';
const { ethers } = hardhat;
import Safe, { SafeFactory } from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { CreateCallAbi } from "../ABI/ABI.js";

dotenv.config();

const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(
    "https://rpc2.sepolia.org"
);
const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
const ProxyContract = await ethers.getContractFactory("ProxyContract");
const bytecode = ProxyContract.bytecode;

const tokenAddr = process.env.USDC_ADDR;
const ownerAddress = process.env.SAFE_ADDRESS;

const Erc20VaultService = process.env.ERC20VAULTSERVICEIMPL_ADDRESS;
const initializeData = new ethers.utils.Interface([{
    "inputs": [
        {
            "internalType": "address",
            "name": "_token",
            "type": "address"
        },
        {
            "internalType": "string",
            "name": "_name",
            "type": "string"
        },
        {
            "internalType": "address",
            "name": "_owner",
            "type": "address"
        }
    ],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}]).encodeFunctionData("initialize", [tokenAddr, "ERC20VAULT", ownerAddress]);
const _data = new ethers.utils.AbiCoder().encode(["address", "bytes"], [Erc20VaultService, initializeData]);

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
console.log("txn hash", safeTxHash);

const transactionConfig = {
    safeAddress: SAFE_ADDRESS,
    safeTransactionData: safeTx.data,
    safeTxHash: safeTxHash,
    senderAddress: process.env.SENDER_ADDRESS,
    senderSignature: signature.data,
};

await safeService.proposeTransaction(transactionConfig);
