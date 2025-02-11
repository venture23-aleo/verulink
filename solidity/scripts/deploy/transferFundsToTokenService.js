import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    const usdcToken = process.env.USDC_ADDR;
    const usdcTokenAddress = await ethers.getContractFactory("USDCMock");
    const usdcTokenContract = new ethers.Contract(usdcToken, usdcTokenAddress.interface.format(), deployerSigner);

    const usdtToken = process.env.USDT_ADDR;
    const usdtTokenAddress = await ethers.getContractFactory("USDTMock");
    const usdtTokenContract = new ethers.Contract(usdtToken, usdtTokenAddress.interface.format(), deployerSigner);

    const ERC20TokenService = await ethers.getContractFactory("TokenServiceV2");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);

    console.log("Transfering USDC to tokenservice...");
    await usdcTokenContract["approve(address,uint256)"](tokenServiceProxyAddress, 100000000);
    await usdtTokenContract["approve(address,uint256)"](tokenServiceProxyAddress, 100000000);

    await TokenServiceContract["transfer(address,uint256,string)"](usdcToken, 100000000, "aleo1hkjqvh3qn4q3lr2sx5wqkt57c7heq826583duc6nlhfctkheyu8sf2qknh", {gasLimit: 1000000});
    await TokenServiceContract["transfer(address,uint256,string)"](usdtToken, 100000000, "aleo1hkjqvh3qn4q3lr2sx5wqkt57c7heq826583duc6nlhfctkheyu8sf2qknh", {gasLimit: 1000000});
    await TokenServiceContract["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: ethers.utils.parseEther("0.01"),  gasLimit:1000000 });

    console.log("USDC transferred successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });