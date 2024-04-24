import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const newOwner = new ethers.Wallet(process.env.SECRET_KEY5, provider);
    const ERC20VaultService = await ethers.getContractFactory("ERC20VaultService");
    const erc20VaultServiceProxy = process.env.ERC20VAULTSERVICEPROXY_ADDRESS;
    const ERC20VaultServiceABI = ERC20VaultService.interface.format();
    const ERC20VaultServiceCotract = new ethers.Contract(erc20VaultServiceProxy, ERC20VaultServiceABI, deployerSigner);
    console.log("Transferring Ownership to = ", newOwner.address);
    await ERC20VaultServiceCotract.transferOwnership(newOwner.address);
    console.log("ERC20VaultService New Owner = ", await ERC20VaultServiceCotract.owner());
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });