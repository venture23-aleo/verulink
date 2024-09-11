import * as dotenv from "dotenv";
import hardhat from 'hardhat';
const { ethers } = hardhat;
import Safe from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";

dotenv.config();

const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(
    "https://rpc2.sepolia.org"
);
const ERC20TokenbridgeImpl = await ethers.getContractFactory("Bridge", {
    libraries: {
        PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
    },
});

const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);

const tokenbridgenewImplementationAddress = process.env.TOKENBRIDGENEWIMPLEMENTATION_ADDRESS;
const tokenbridgeProxyAddress = process.env.TOKENBRIDGEPROXY_ADDRESS;

// Encode deployment
const deployerInterface = new ethers.utils.Interface(ERC20TokenbridgeImpl.interface.format());
const deployCallData = deployerInterface.encodeFunctionData("upgradeTo", [
    tokenbridgenewImplementationAddress
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
    to: tokenbridgeProxyAddress,
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
