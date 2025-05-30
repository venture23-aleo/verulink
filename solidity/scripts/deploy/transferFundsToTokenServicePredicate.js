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
    const transferAmount = 40000000;
    const receiver = "aleo1jga9hrn0d5umq2tsqty2tcvtjkvd8n9r0g7cj7fq5vld4y6hesgsq23n3l";
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
            ? await TokenServiceContract['privateTransfer(string,(string,uint256,address[],bytes[]),bool,bytes)'](
                receiver,
                [predicateMessage.taskId, predicateMessage.expireByBlockNumber, predicateMessage.signerAddresses, predicateMessage.signatures],
                true,
                "0x",
                { value: transferAmount, gasLimit: 1000000 }
            )
            : await TokenServiceContract['privateTransfer(address,uint256,string,(string,uint256,address[],bytes[]),bool,bytes)'](
                selectedToken.tokenAddress,
                transferAmount,
                receiver,
                [predicateMessage.taskId, predicateMessage.expireByBlockNumber, predicateMessage.signerAddresses, predicateMessage.signatures],
                true,
                "0x04010b65e222bc6ccb31cef42a8acef4bd9aac060a00112460f03d5701876ab53ca74316808776b70d44badb0abc27aae0bd402f9f8e84fc5c8ca43d36176bbd73b8d880f38990f15ebfab23c5959dea6db4df284db08f726797175474096228d821b988ffa925c8c281beb7f438d5688ab9577a711565f57e9b4e56936654cd3907e1514e227340efc83e304ff7770f8cfc5436db4ee36bbdb0d983f90385ef3916efc2adb8052fbb1df02fa8b85a70d1ccb8d4b20f278fb1ac69d6a9bd5fa4b8108c",
                { gasLimit: 1000000 }
            );

            // const transfer = selectedToken.isNative
            // ? await TokenServiceContract['transfer(string,(string,uint256,address[],bytes[]),bool,bytes)'](
            //     receiver,
            //     [predicateMessage.taskId, predicateMessage.expireByBlockNumber, predicateMessage.signerAddresses, predicateMessage.signatures],
            //     true,
            //     "0x",
            //     { value: transferAmount, gasLimit: 1000000 }
            // )
            // : await TokenServiceContract['transfer(address,uint256,string,(string,uint256,address[],bytes[]),bool,bytes)'](
            //     selectedToken.tokenAddress,
            //     transferAmount,
            //     receiver,
            //     [predicateMessage.taskId, predicateMessage.expireByBlockNumber, predicateMessage.signerAddresses, predicateMessage.signatures],
            //     true,
            //     "0x",
            //     { gasLimit: 1000000 }
            // );

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