import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );

    // Helper function to validate addresses and detect ENS names
    function validateAddress(address, name) {
        if (!address) {
            throw new Error(`${name} is not defined in environment variables`);
        }
        if (address.endsWith('.eth')) {
            throw new Error(`${name} contains an ENS name (${address}). BSC testnet doesn't support ENS. Please use a proper address.`);
        }
        if (!ethers.utils.isAddress(address)) {
            throw new Error(`${name} is not a valid address: ${address}`);
        }
        return address;
    }

    const tokenAddress = validateAddress(process.env.WRAPPED_TOKEN_PROXY_ADDRESS, "WRAPPED_TOKEN_PROXY_ADDRESS");
    const vault = process.env.ZERO_ADDRESS; // This should be address(0)
    const destChainId = process.env.ALEO_CHAINID;
    const destTokenAddress = process.env.DEST_TOKEN_ADDRESS_ALEO;
    const destTokenService = process.env.DEST_TOKENSERVICE;
    const min = process.env.MIN_WUSDC;
    const max = process.env.MAX_WUSDC;

    const tokenServiceProxyAddress = validateAddress(process.env.WRAPPED_TOKENSERVICE_PROXY_ADDRESS, "WRAPPED_TOKENSERVICE_PROXY_ADDRESS");

    console.log("Validated addresses:");
    console.log("Token Address:", tokenAddress);
    console.log("TokenService Proxy Address:", tokenServiceProxyAddress);
    console.log("Vault:", vault);
    console.log("Dest TokenService:", destTokenService);
    console.log("Dest Chain ID:", destChainId);
    console.log("Min:", min);
    console.log("Max:", max);

    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const TokenServiceWrapped = await ethers.getContractFactory("TokenServiceWrapped");

    console.log("Adding WrappedAleo to wrapped tokenservice...");
    const TokenServiceWrappedABI = TokenServiceWrapped.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceWrappedABI, deployerSigner);
    await TokenServiceContract.addToken(tokenAddress, destChainId, vault, destTokenAddress, destTokenService, min, max);
    console.log("WrappedAleo added successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });