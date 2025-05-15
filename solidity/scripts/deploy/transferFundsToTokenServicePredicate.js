import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
import axios from "axios";

import { packFunctionArgs, signaturesToBytes } from "predicate-sdk";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    const VITE_BASE_API_URL = " https://staging.api.predicate.io/v1/task";
    // const VITE_BASE_API_URL = "https://api.predicate.io/v1/task";
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

    const predicateServiceAddress=process.env.PREDICATE_SERVICE;

    console.log("Transfering USDC to tokenservice...");
    const transferAmount = 50000000;
    const receiver = "aleo19lu7tcg5v3c7ke5gn98h0v7crsn4jcct4uck0u0q9ewuhtc0hc9s0rygds";
    const selectedToken = {
        isNative: false, // Set to true if the token is native (ETH), false otherwise
        tokenAddress: usdcToken
    };

    const encodedArgs = selectedToken.isNative
        ? packFunctionArgs('_transfer(string)', [receiver])
        : packFunctionArgs('_transfer(address,uint256,string)', [
            selectedToken.tokenAddress,
            transferAmount,
            receiver,
        ]);

    try {
        const signatures = await axios.post(`${VITE_BASE_API_URL}`, {
            from: deployerSigner.address,
            to: predicateServiceAddress,
            data: encodedArgs,
            value: selectedToken.isNative ? transferAmount.toString() : '0',
            msg_value: selectedToken.isNative ? transferAmount.toString() : '0'
        }, {
            headers: {
                "x-api-key": "eggcVs2JRX4JurIWpUtK0akaygakr2Hy58AZE68n"
            }
        });

        if (!signatures.data.is_compliant) {
            throw new Error('transaction is not compliant');
        }

        const predicateMessage = signaturesToBytes(signatures.data);

        const transfer = selectedToken.isNative
            ? await TokenServiceContract['transfer(string,(string,uint256,address[],bytes[]))'](
                receiver,
                [predicateMessage.taskId, predicateMessage.expireByBlockNumber, predicateMessage.signerAddresses, predicateMessage.signatures],
                { value: transferAmount, gasLimit: 1000000 }
            )
            : await TokenServiceContract['transfer(address,uint256,string,(string,uint256,address[],bytes[]))'](
                selectedToken.tokenAddress,
                transferAmount,
                receiver,
                [predicateMessage.taskId, predicateMessage.expireByBlockNumber, predicateMessage.signerAddresses, predicateMessage.signatures],
                { gasLimit: 1000000 }
            );

        console.log("TRANSFER: ", transfer);
    } catch (error) {
        console.error("Error making request:", error.response ? error.response.data : error.message);
    }

    console.log("Funds transferred successfully!!!");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });