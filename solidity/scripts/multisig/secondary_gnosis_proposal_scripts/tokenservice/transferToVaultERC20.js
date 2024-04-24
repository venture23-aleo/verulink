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

async function transferToVaultERC20(signer) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeService = new SafeApiKit.default({
    txServiceUrl: "https://safe-transaction-sepolia.safe.global",
    ethAdapter,
  });

  const tokenAddress = process.env.USDC_ADDR;
  const amount = "1999533999999999000000";

  const tokenServiceProxyAddress = process.env.TOKENSERVICEPROXY_ADDRESS;
  const ERC20TokenService = await ethers.getContractFactory("TokenService");
  const iface = new ethers.utils.Interface(ERC20TokenService.interface.format());
  const calldata = iface.encodeFunctionData("transferToVault", [tokenAddress, amount]);
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

transferToVaultERC20(new ethers.Wallet(process.env.SECRET_KEY1, provider));