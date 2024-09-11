import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const newOwner = process.env.SAFE_ADDRESS;
    const ERC20VaultServiceUSDT = await ethers.getContractFactory("Erc20VaultService");
    const erc20VaultServiceProxyUSDT = process.env.ERC20VAULTSERVICE_PROXY_ADDRESS_USDT;
    console.log("Transferring Ownership of ERC20VaultServiceUSDT to = ", newOwner);
    const Erc20VaultServiceABI = ERC20VaultServiceUSDT.interface.format();
    const Erc20VaultServiceContract = new ethers.Contract(erc20VaultServiceProxyUSDT, Erc20VaultServiceABI, deployerSigner);
    await Erc20VaultServiceContract.transferOwnership(newOwner);
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });