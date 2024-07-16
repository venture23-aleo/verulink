import hardhat from 'hardhat';
const { ethers } = hardhat;
import Safe from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";

import * as dotenv from "dotenv";
dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc2.sepolia.org"
);
console.log("ethers version = ", ethers.version);

async function addTokenService(signer) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeService = new SafeApiKit.default({
    txServiceUrl: "https://safe-transaction-sepolia.safe.global",
    ethAdapter,
  });

  const tokenService = process.env.TOKENSERVICEPROXY_ADDRESS;
  const holdingProxyAddress = process.env.HOLDINGPROXY_ADDRESS;
  const HoldingImpl = await ethers.getContractFactory("Holding");
  const iface = new ethers.utils.Interface(HoldingImpl.interface.format());
  const calldata = iface.encodeFunctionData("addTokenService", [tokenService]);
  const safeSdk = await Safe.default.create({
    ethAdapter: ethAdapter,
    safeAddress: process.env.SAFE_ADDRESS,
  });

  const txData = {
    to: ethers.utils.getAddress(holdingProxyAddress),
    value: "0",
    data: calldata,
  };

  const safeTx = await safeSdk.createTransaction({
    safeTransactionData: txData,
  });
  const safeTxHash = await safeSdk.getTransactionHash(safeTx);

  console.log("txn hash", safeTxHash);
  const signature = await safeSdk.signTypedData(safeTx);

  const transactionConfig = {
    safeAddress: process.env.SAFE_ADDRESS,
    safeTransactionData: safeTx.data,
    safeTxHash: safeTxHash,
    senderAddress: process.env.SENDER_ADDRESS,
    senderSignature: signature.data,
  };

  await safeService.proposeTransaction(transactionConfig);
}

addTokenService(new ethers.Wallet(process.env.SECRET_KEY1, provider));