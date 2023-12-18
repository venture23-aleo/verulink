import { ethers, Wallet } from "ethers";
import Safe from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import {tokenServiceImplementationABI} from "../ABI/ABI.js";

import * as dotenv from "dotenv";
dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(
  "https://eth-goerli.g.alchemy.com/v2/fLCeKO4GA9Gc3js8MUt9Djy7WHCFxATq"
);

// const safeAddress = process.env.SAFE_ADDRESS;

async function addToken(safeAddress, senderAddress, signer) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeService = new SafeApiKit.default({
    txServiceUrl: "https://safe-transaction-goerli.safe.global",
    ethAdapter,
  });

  const tokenAddress = "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557"; 
  const tokenServiceProxyAddress = process.env.TOKENSERVICEPROXY_ADDRESS;
  const abi = tokenServiceImplementationABI;
  const iface = new ethers.utils.Interface(abi);
  const calldata = iface.encodeFunctionData("removeToken", [tokenAddress]);
  const safeSdk = await Safe.default.create({
    ethAdapter: ethAdapter,
    safeAddress: process.env.SAFE_ADDRESS,
  });

  const txData = {
    to: ethers.utils.getAddress(tokenServiceProxyAddress),
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

addToken(
  process.env.SAFE_ADDRESS,
  process.env.SENDER_ADDRESS,
  new Wallet(process.env.SECRET_KEY1, provider)
);