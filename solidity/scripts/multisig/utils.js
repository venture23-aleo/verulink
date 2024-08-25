// utils.js
import fs from "fs";
import Safe, { SafeFactory } from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import hardhat from 'hardhat';
const { ethers } = hardhat;

// Function to update .env file
export function updateEnvFile(key, value) {
    const envFilePath = '.env';

    // Read the current .env file
    let envContent = fs.existsSync(envFilePath) ? fs.readFileSync(envFilePath, 'utf8') : '';

    // Check if the key already exists in the file
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(envContent)) {
        // Replace the existing key-value pair
        envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
        // Append the new key-value pair
        envContent += `\n${key}=${value}`;
    }

    // Write the updated content back to the .env file
    fs.writeFileSync(envFilePath, envContent);
}

// Approve the transaction
export async function approveTransaction(safeTxHash, signer, safeAddress) {
    const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: signer,
    });

    const safeSdk = await Safe.default.create({
        ethAdapter: ethAdapter,
        safeAddress: safeAddress,
    });

    const execute = await safeSdk.approveTransactionHash(safeTxHash);
    const receipt = await execute.transactionResponse?.wait();
    return receipt;
}

// Execute the transaction
export async function executeTransaction(safeTxHash, signer, safeAddress) {
    const ethAdapter = new EthersAdapter({
        ethers,
        signerOrProvider: signer,
    });

    const safeService = new SafeApiKit.default({
        txServiceUrl: "https://safe-transaction-sepolia.safe.global",
        ethAdapter,
    });

    const safeTransaction = await safeService.getTransaction(safeTxHash);
    const safeSdk = await Safe.default.create({
        ethAdapter: ethAdapter,
        safeAddress: safeAddress,
    });

    const execute = await safeSdk.executeTransaction(safeTransaction);
    const receipt = await execute.transactionResponse?.wait();
    return receipt;
}

// Function to trim leading zeros from a hex address
export function trimHexAddress(hex) {
    if (hex.startsWith('0x')) {
        hex = hex.slice(2);
    }
    // Trim leading zeros
    hex = hex.replace(/^0{24}/, '');
    return '0x' + hex;
}
