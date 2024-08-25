import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );

    const tokenAddress = process.env.USDC_ADDR;
    const vault = process.env.ERC20VAULTSERVICEPROXY_ADDRESS_USDC;
    const destChainId = "6694886634403";
    const destTokenAddress = "7190692537453907461105790569797103513515746302149567971663963167242253971983field";
    const destTokenService = "aleo19250rwuhvzuee3hm7uah4d2a5ghmgvkccnxwq92txudaq4yesgxqh3gfra";
    const min = "10";
    const max = "1000000000000000000000000";

    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICEPROXY_ADDRESS;
    const ERC20TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, ERC20TokenServiceABI, deployerSigner);
    await TokenServiceContract.addToken(tokenAddress, destChainId, vault, destTokenAddress, destTokenService, min, max);
    console.log("USDC added successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });