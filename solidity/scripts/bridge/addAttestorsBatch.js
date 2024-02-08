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

async function addAttestorsBatch(signer) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeService = new SafeApiKit.default({
    txServiceUrl: "https://safe-transaction-sepolia.safe.global",
    ethAdapter,
  });

  const attestors = ["0x684C68bE1b58f61a33888E0eE3EA63f021d8CB0a", "0xBFac07DaC6f0d57D6655d17824B7f7c0514EA607"];
  const newQuorumRequired = 2;
  const ERC20TokenbridgeImpl = await ethers.getContractFactory("ERC20TokenBridge", {
    libraries: {
      PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
    },
  });
  const tokenbridgeProxyAddress = process.env.TOKENBRIDGEPROXY_ADDRESS;
  const iface = new ethers.utils.Interface(ERC20TokenbridgeImpl.interface.format());
  const calldata = iface.encodeFunctionData("addAttestors", [attestors, newQuorumRequired]);
  const safeSdk = await Safe.default.create({
    ethAdapter: ethAdapter,
    safeAddress: process.env.SAFE_ADDRESS,
  });

  const txData = {
    to: tokenbridgeProxyAddress,
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

addAttestorsBatch(
  new ethers.Wallet(process.env.SECRET_KEY1, provider)
);