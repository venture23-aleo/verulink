import * as dotenv from "dotenv";
import hardhat from 'hardhat';
const { ethers } = hardhat;
import Safe from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import { approveTransaction, executeTransaction } from "../../utils.js";

dotenv.config();

const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER);

async function proposeUpgradeImplementationTransaction(signer) {
    const BlackListService = await ethers.getContractFactory("BlackListService");

    const blackListServicenewImplementationAddress = process.env.BLACKLISTSERVICENEWIMPLEMENTATION_ADDRESS;
    const blackListServiceProxyAddress = process.env.BLACKLISTSERVICEPROXY_ADDRESS;

    // Encode deployment
    const deployerInterface = new ethers.utils.Interface(BlackListService.interface.format());
    const deployCallData = deployerInterface.encodeFunctionData("upgradeTo", [
        blackListServicenewImplementationAddress
    ]);

    const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: signer,
    });

    const safeService = new SafeApiKit.default({
        txServiceUrl: process.env.txServiceUrl,
        ethAdapter,
    });

    const txData = {
        to: ethers.utils.getAddress(blackListServiceProxyAddress),
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

    return safeTxHash;
}

(async () => {
    try {
        const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
        const safeTxHash = await proposeUpgradeImplementationTransaction(deployerSigner);

        // Approve transaction using additional signers
        const secondSigner = new ethers.Wallet(process.env.SECRET_KEY2, provider);
        const thirdSigner = new ethers.Wallet(process.env.SECRET_KEY3, provider);

        await approveTransaction(safeTxHash, secondSigner, SAFE_ADDRESS);
        await approveTransaction(safeTxHash, thirdSigner, SAFE_ADDRESS);

        // Execute transaction
        const executor = new ethers.Wallet(process.env.SECRET_KEY4, provider);
        await executeTransaction(safeTxHash, executor, SAFE_ADDRESS);

        console.log("Upgrade of implementation successful!");
    } catch (error) {
        console.error("Error processing transaction:", error);
    }
})();
