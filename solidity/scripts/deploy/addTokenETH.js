import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );

    const tokenAddress = process.env.ONE_ADDRESS;
    const vault = process.env.ETHVAULTSERVICEPROXY_ADDRESS;
    const destChainId = "6694886634403";
    const destTokenAddress = "8407163152768679817200595503789898686435014956247376136715234463968754771120field";
    const destTokenService = "aleo19250rwuhvzuee3hm7uah4d2a5ghmgvkccnxwq92txudaq4yesgxqh3gfra";
    const min = "10";
    const max = "1000000000000000000000000";

    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICEPROXY_ADDRESS;
    const ERC20TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, ERC20TokenServiceABI, deployerSigner);
    await TokenServiceContract.addToken(tokenAddress, destChainId, vault, destTokenAddress, destTokenService, min, max);
    console.log("ETH added successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });