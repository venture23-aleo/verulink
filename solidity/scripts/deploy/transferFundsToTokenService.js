import hardhat from "hardhat";

const { ethers } = hardhat;
import * as dotenv from "dotenv";
import { BigNumber } from "ethers";

dotenv.config();

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER);
  const deployerSigner = new ethers.Wallet(
    process.env.DEPLOYER_PRIVATE_KEY,
    provider
  );

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
  let receiver =
    "aleo19lu7tcg5v3c7ke5gn98h0v7crsn4jcct4uck0u0q9ewuhtc0hc9s0rygds";

  //   await usdcTokenContract["approve(address,uint256)"](
  //     tokenServiceProxyAddress,
  //     BigNumber.from("5000000000")
  //   ); // approving USDC to tokenservice
  // await usdtTokenContract["approve(address,uint256)"](tokenServiceProxyAddress, BigNumber.from("100000000")); // approving USDT to tokenservice

  //   await TokenServiceContract["transfer(address,uint256,string,bool,bytes)"](
  //     usdcToken,
  //     BigNumber.from("30000000"),
  //     receiver,
  //     true,
  //     "0x",
  //     { gasLimit: 10000000 }
  //   );

  //   await TokenServiceContract["transfer(address,uint256,string,bool,bytes)"](
  //     usdcToken,
  //     BigNumber.from("20000000"),
  //     receiver,
  //     true,
  //     "0x04c02fdc697d4dfd945ccaf72b623338f7a1fa567b1995b87386c45989efd95a973998920367363cdb3b198ce33b6cb97680cbb0aea5090a67fbede038dad8764ce83af3a078de3f26f51701be2919905158109a5781e150a64eda5d4e370b207fe567bbfb026a05f9fdf4e86a608d6c0def1b5b45d52095870bc0ac0748bb7afde452bf0c5543a1bcc6f44a0c900a314ee442553c98e58a38fd252a776639a30dc7500cd84cf32a1076a6a5de2c558e9943ecaa64f5c20695d69fb9e541e53f40bdae97e5c0b17b1ea3191f307de13c4b4ab15cf937831c389a3a47920ed1303e9e9886ea2a49ca11f02cd5491b0225f09160a0e2591b3dcfe05937bbaf9fa8af02a1993dc2",
  //     { gasLimit: 10000000 }
  //   );
  // await TokenServiceContract["transfer(address,uint256,string)"](usdtToken, BigNumber.from("100000"), receiver, {gasLimit: 1000000});
  // await TokenServiceContract["transfer(string)"](receiver, { value: ethers.utils.parseEther("0.01"),  gasLimit:1000000 });

  // console.log("USDC transferred successfully!!!");

  receiver = "aleo1jga9hrn0d5umq2tsqty2tcvtjkvd8n9r0g7cj7fq5vld4y6hesgsq23n3l";
  await TokenServiceContract[
    "privateTransfer(address,uint256,string,bool,bytes)"
  ](
    usdcToken,
    BigNumber.from("10000000"),
    receiver,
    true,
    "0x04010b65e222bc6ccb31cef42a8acef4bd9aac060a00112460f03d5701876ab53ca74316808776b70d44badb0abc27aae0bd402f9f8e84fc5c8ca43d36176bbd73b8d880f38990f15ebfab23c5959dea6db4df284db08f726797175474096228d821b988ffa925c8c281beb7f438d5688ab9577a711565f57e9b4e56936654cd3907e1514e227340efc83e304ff7770f8cfc5436db4ee36bbdb0d983f90385ef3916efc2adb8052fbb1df02fa8b85a70d1ccb8d4b20f278fb1ac69d6a9bd5fa4b8108c",
    { gasLimit: 1000000 }
  );
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
