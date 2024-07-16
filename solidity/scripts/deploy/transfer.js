import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const tokenAddr = process.env.USDC_ADDR;
    const amount = 100;
    const receiver = "aleo1tvuwdl7remyvccqypa5lzehrdd5tnqpuy49jv7h6uw5au67pkupsjljwgn";
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxy = "0xFEac0FD32367da944498b39f3D1EbD64cC88E13c";
    let TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxy, TokenServiceABI, deployerSigner);
    console.log("Generating packets 10,000 times...");
    for (let i = 0; i < 1000; i++) {
        await TokenServiceContract["transfer(address,uint256,string)"](tokenAddr, amount, receiver);
        console.log(`Round ${i + 1} of 10,000 packets generation completed!!!`);
    }
    console.log("All rounds completed!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });