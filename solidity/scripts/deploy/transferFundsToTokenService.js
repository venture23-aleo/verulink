import hardhat from "hardhat";

const { ethers } = hardhat;
import * as dotenv from "dotenv";
import { BigNumber } from "ethers";

dotenv.config();

async function main() {
  try{
    const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER);
    const deployerSigner = new ethers.Wallet(
      process.env.DEPLOYER_PRIVATE_KEY,
      provider
    );
    
    // Check network connection
    const network = await provider.getNetwork();
    console.log("Connected to network:", network.name, "Chain ID:", network.chainId);

  const usdcToken = process.env.USDC_ADDR;
  const usdcTokenAddress = await ethers.getContractFactory("USDCMock");
  const usdcTokenContract = new ethers.Contract(
    usdcToken,
    usdcTokenAddress.interface.format(),
    deployerSigner
  );

  const usdtToken = process.env.USDT_ADDR;
  const usdtTokenAddress = await ethers.getContractFactory("USDTMock");
  const usdtTokenContract = new ethers.Contract(
    usdtToken,
    usdtTokenAddress.interface.format(),
    deployerSigner
  );

  const ERC20TokenService = await ethers.getContractFactory("TokenServiceV3");
  const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
  const TokenServiceABI = ERC20TokenService.interface.format();
  const TokenServiceContract = new ethers.Contract(
    tokenServiceProxyAddress,
    TokenServiceABI,
    deployerSigner
  );

  console.log("Transfering USDC to tokenservice...");
  console.log("USDC Token Address:", usdcToken);
  console.log("TokenService Proxy Address:", tokenServiceProxyAddress);
  console.log("Deployer Address:", deployerSigner.address);
  
  // // Check current allowance
  const currentAllowance = await usdcTokenContract.allowance(deployerSigner.address, tokenServiceProxyAddress);
  console.log("Current USDC allowance:", currentAllowance.toString());
  
  // Check deployer's USDC balance
  const balance = await usdcTokenContract.balanceOf(deployerSigner.address);
  console.log("Deployer USDC balance:", balance.toString());

  const approvalAmount = BigNumber.from("100000000");
  console.log("Approving USDC amount:", approvalAmount.toString());

  const approveTx = await usdcTokenContract["approve(address,uint256)"](
    tokenServiceProxyAddress,
    approvalAmount
  ); // approving USDC to tokenservice
  
  console.log("Approval transaction hash:", approveTx.hash);
  console.log("Waiting for transaction confirmation...");
  
  let receipt = await approveTx.wait();
  console.log("Transaction confirmed in block:", receipt.blockNumber);
  console.log("Gas used:", receipt.gasUsed.toString());
  
  // Verify the approval
  const newAllowance = await usdcTokenContract.allowance(deployerSigner.address, tokenServiceProxyAddress);
  console.log("New USDC allowance:", newAllowance.toString());

  let receiver = "aleo19lu7tcg5v3c7ke5gn98h0v7crsn4jcct4uck0u0q9ewuhtc0hc9s0rygds";

    const transferTx = await TokenServiceContract["transfer(address,uint256,string,bool,bytes)"](
      usdcToken,
      BigNumber.from("30000000"),
      receiver,
      false,
      "0x",
      { gasLimit: 10000000 }
    );
    console.log("Transfer transaction hash:", transferTx.hash);
    console.log("Waiting for transaction confirmation...");
    
    receipt = await transferTx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    
  // await TokenServiceContract["transfer(string)"](receiver, { value: ethers.utils.parseEther("0.01"),  gasLimit:1000000 });

  console.log("USDC transferred successfully!!!");

  } catch (error) {
    console.error("Error in main function:", error.message);
    if (error.transaction) {
      console.error("Transaction hash:", error.transaction.hash);
    }
    if (error.receipt) {
      console.error("Transaction failed in block:", error.receipt.blockNumber);
    }
    throw error;
  }

  // receiver = "aleo19lu7tcg5v3c7ke5gn98h0v7crsn4jcct4uck0u0q9ewuhtc0hc9s0rygds";
  // await TokenServiceContract[
  //   "privateTransfer(address,uint256,string,bool,bytes)"
  // ](
  //   usdcToken,
  //   BigNumber.from("11000000"),
  //   receiver,
  //   true,
  //   "0x04641ae3a7b0c7ec055d227b57b990f20baeecb75e18e510bcb6547df04622d429c46e91938be23a40ce4ebe4c34651a8a941a5dbd4f82d37d9914e6a9143803cad7cec09968f1f9177251bd5df83cfce582f268553bf7559bcad083416fa1211345c04b0fb576f3523cef82fc37f8959a1c3bc590055fb8e1e25f60eef82a8685ce5998a5078b899e3056ef6ec7796a619134a747ced7edbb98c9517a90c070cfa5fbe46471fae8b316109e09337da64d0de9f3b65be6c29d47b67b2ef3238842b279",
  //   { gasLimit: 1000000 }
  // );
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
