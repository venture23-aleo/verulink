import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const MINTER_ROLE = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("MINTER_ROLE"));
    const tokenServiceProxy = process.env.WRAPPED_TOKENSERVICE_PROXY_ADDRESS;

    // Get the contract factory for the "WrappedTokens" contract
    const WrappedTokens = await ethers.getContractFactory("WrappedTokens");

    const wrappedTokens = process.env.WRAPPED_TOKEN_PROXY_ADDRESS;
    console.log("Granting service role to tokenservice");
    const WrappedTokensABI = WrappedTokens.interface.format();
    const WrappedTokensContract = new ethers.Contract(wrappedTokens, WrappedTokensABI, deployerSigner);
    await WrappedTokensContract.grantRole(MINTER_ROLE, tokenServiceProxy);
    console.log("Role granted successfully!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });