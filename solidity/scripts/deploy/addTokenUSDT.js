import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );

    const tokenAddress = process.env.USDT_ADDR;
    const vault = process.env.ERC20VAULTSERVICEPROXY_ADDRESS_USDT;
    const destChainId = "6694886634403";
    const destTokenAddress = "aleo1lngh5f7udxd2lw9scxdtmqlqv5nwravzx9fjt8t27d84espseurqtzn76k";
    const destTokenService = "aleo183jh4zpjf0fs3jscumlqtemjdtdvlzhda0ex7hxw5lmdlxurlqqq75tcly";
    const min = "10";
    const max = "1000000000000000000000000";

    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICEPROXY_ADDRESS;
    const ERC20TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, ERC20TokenServiceABI, deployerSigner);
    await TokenServiceContract.addToken(tokenAddress, destChainId, vault, destTokenAddress, destTokenService, min, max);
    console.log("USDT added successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });