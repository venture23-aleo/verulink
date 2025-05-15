import hardhat from 'hardhat';

const {ethers} = hardhat;
import * as dotenv from "dotenv";
import {BigNumber} from 'ethers';



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

    const ERC20TokenService = await ethers.getContractFactory("TokenServiceV3");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);

    console.log("Transfering USDC to tokenservice...");
    let receiver = "aleo19lu7tcg5v3c7ke5gn98h0v7crsn4jcct4uck0u0q9ewuhtc0hc9s0rygds";

    await usdcTokenContract["approve(address,uint256)"](tokenServiceProxyAddress, BigNumber.from("5000000000")); // approving USDC to tokenservice
    // await usdtTokenContract["approve(address,uint256)"](tokenServiceProxyAddress, BigNumber.from("100000000")); // approving USDT to tokenservice
    
    await TokenServiceContract["transfer(address,uint256,string)"](usdcToken, BigNumber.from("40000000"), receiver, {gasLimit: 10000000});
    // await TokenServiceContract["transfer(address,uint256,string)"](usdtToken, BigNumber.from("100000"), receiver, {gasLimit: 1000000});
    // await TokenServiceContract["transfer(string)"](receiver, { value: ethers.utils.parseEther("0.01"),  gasLimit:1000000 });

    // console.log("USDC transferred successfully!!!");

    // receiver = "aleo1eansky62w3nex5fyt3u7ppk9uea9ys25v08x6qt6tfa63xtdtgrs5kaz0e";
    // await TokenServiceContract["privateTransfer(address,uint256,string)"](usdcToken, BigNumber.from("100000000"), receiver, {gasLimit: 1000000});
    // await TokenServiceContract["privateTransfer(address,uint256,string)"](usdtToken, BigNumber.from("1000000"), receiver, {gasLimit: 1000000});
    // await TokenServiceContract["privateTransfer(string)"](receiver, { value: ethers.utils.parseEther("0.1"),  gasLimit:1000000 });

    // console.log("USDC transferred privately successfully!!!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });