import hardhat from 'hardhat';
const { ethers } = hardhat;
import Safe from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import * as dotenv from "dotenv";
dotenv.config();
import { approveTransaction, executeTransaction } from "../utils.js";

const SAFE_ADDRESS = process.env.SAFE_ADDRESS;

const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc2.sepolia.org"
);

async function ProposeAddTokenUSDTTransaction(deployerSigner) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: deployerSigner,
  });

  const safeService = new SafeApiKit.default({
    txServiceUrl: "https://safe-transaction-sepolia.safe.global",
    ethAdapter,
  });

  const tokenAddress = process.env.USDT_ADDR;
  const vault = process.env.ERC20VAULTSERVICEPROXY_ADDRESS_USDT;
  const destChainId = "6694886634403";
  const destTokenAddress = "6228544267661408531186614851675481007188470102749792340423762646386623209164field";
  const destTokenService = "aleo1rqps4l9fxw8mgpcqf7ljkwv3995nu460cd374s6q76v5jlmrngpsv4uxr4";
  const min = "10";
  const max = "1000000000000000000000000";

  const tokenServiceProxyAddress = process.env.TOKENSERVICEPROXY_ADDRESS;
  const ERC20TokenService = await ethers.getContractFactory("TokenService");
  const iface = new ethers.utils.Interface(ERC20TokenService.interface.format());
  const calldata = iface.encodeFunctionData("addToken", [tokenAddress, destChainId, vault, destTokenAddress, destTokenService, min, max]);
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
    const safeTxHash = await ProposeAddTokenUSDTTransaction(deployerSigner);

    // Approve transaction using additional signers
    const secondSigner = new ethers.Wallet(process.env.SECRET_KEY2, provider);
    const thirdSigner = new ethers.Wallet(process.env.SECRET_KEY3, provider);

    await approveTransaction(safeTxHash, secondSigner, SAFE_ADDRESS);
    await approveTransaction(safeTxHash, thirdSigner, SAFE_ADDRESS);

    // Execute transaction
    const executor = new ethers.Wallet(process.env.SECRET_KEY4, provider);
    await executeTransaction(safeTxHash, executor, SAFE_ADDRESS);
    console.log("USDT added successfully!!!");
  } catch (error) {
    console.error("Error processing transaction:", error);
  }
})();