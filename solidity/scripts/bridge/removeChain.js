import { ethers, Wallet } from "ethers";
import Safe from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import {TokenBridgeImplementationABI} from "../ABI/ABI.js";

import * as dotenv from "dotenv";
dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(
  "https://eth-goerli.g.alchemy.com/v2/fLCeKO4GA9Gc3js8MUt9Djy7WHCFxATq"
);

// const safeAddress = process.env.SAFE_ADDRESS;

async function addChain(safeAddress, senderAddress, signer) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeService = new SafeApiKit.default({
    txServiceUrl: "https://safe-transaction-goerli.safe.global",
    ethAdapter,
  });

  const chainId = 54;
  const tokenbridgeProxyAddress = process.env.tokenbridgeProxyAddress;
  const abi = TokenBridgeImplementationABI;
  const iface = new ethers.utils.Interface(abi);
  const calldata = iface.encodeFunctionData("removeChain", [chainId]);
  const safeSdk = await Safe.default.create({
    ethAdapter: ethAdapter,
    safeAddress: process.env.SAFE_ADDRESS,
  });

  const txData = {
    to: ethers.utils.getAddress(tokenbridgeProxyAddress),
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

addChain(
  process.env.SAFE_ADDRESS,
  process.env.SENDER_ADDRESS,
  new Wallet(process.env.secret_key1, provider)
);