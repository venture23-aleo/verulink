import * as dotenv from "dotenv";
import hardhat from 'hardhat';
const { ethers } = hardhat;
import Safe, { SafeFactory } from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";

dotenv.config();

const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(
    "https://rpc2.sepolia.org"
);
const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);

const tokenservicenewImplementationAddress = process.env.TOKENSERVICENEWIMPLEMENTATION_ADDRESS;
const tokenServiceProxyAddress = process.env.TOKENSERVICEPROXY_ADDRESS;

const ERC20TokenService = await ethers.getContractFactory("TokenService");
const deployerInterface = new ethers.utils.Interface(ERC20TokenService.interface.format());
const deployCallData = deployerInterface.encodeFunctionData("upgradeTo", [
    tokenservicenewImplementationAddress
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
    to: tokenServiceProxyAddress,
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
