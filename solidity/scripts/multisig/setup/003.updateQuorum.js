import hardhat from 'hardhat';
const { ethers } = hardhat;
import Safe from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import * as dotenv from "dotenv";
dotenv.config();
import { approveTransaction, executeTransaction } from "../utils.js";

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER);

async function proposeUpdateDestinationChainIdTransaction(signer) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeService = new SafeApiKit.default({
    txServiceUrl: process.env.txServiceUrl,
    ethAdapter,
  });

  const newQuorum = process.env.newquorum;

  const ERC20TokenbridgeImpl = await ethers.getContractFactory("Bridge", {
    libraries: {
      PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
      AleoAddressLibrary: process.env.AleoAddressLibrary,
    },
  });

  const tokenbridgeProxyAddress = process.env.TOKENBRIDGEPROXY_ADDRESS;
  const iface = new ethers.utils.Interface(ERC20TokenbridgeImpl.interface.format());

  const calldata = iface.encodeFunctionData("updateQuorum", [newQuorum]);

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

  const signature = await safeSdk.signTypedData(safeTx);

  const transactionConfig = {
    safeAddress: process.env.SAFE_ADDRESS,
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
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const safeTxHash = await proposeUpdateDestinationChainIdTransaction(deployerSigner);

    // Approve transaction using additional signers
    const secondSigner = new ethers.Wallet(process.env.SECRET_KEY2, provider);
    const thirdSigner = new ethers.Wallet(process.env.SECRET_KEY3, provider);

    await approveTransaction(safeTxHash, secondSigner, process.env.SAFE_ADDRESS);
    await approveTransaction(safeTxHash, thirdSigner, process.env.SAFE_ADDRESS);

    // Execute transaction
    const executor = new ethers.Wallet(process.env.SECRET_KEY4, provider);
    await executeTransaction(safeTxHash, executor, process.env.SAFE_ADDRESS);

    console.log("Threshold Quorum updated successfully!");
  } catch (error) {
    console.error("Error processing transaction:", error);
  }
})();
