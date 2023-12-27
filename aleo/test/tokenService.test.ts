import { BridgeContract } from "../artifacts/js/bridge";
import { Token_serviceContract } from "../artifacts/js/token_service";
import { InPacketFull, TokenOrigin, wrapped_tokenLeo } from "../artifacts/js/types";
import { Wrapped_tokenContract } from "../artifacts/js/wrapped_token";

import { evm2AleoArr, string2AleoArr } from "./utils";

const tokenService = new Token_serviceContract({ networkName: "testnet3", privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH" })

describe("Token Service", () => {
  // USDC Contract Address on Ethereum
  const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

  // User Address on Ethereum
  const ethUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  // Token Service Contract Address on Ethereum
  const ethTsContract = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  // Token Service Contract on Aleo
  const aleoTsContract =
    "aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3";

  // Wrapped USDC Contract Addrpublishess
  const wUSDC =
    "aleo1mvqzu7r5p8payrn7d0rsqqtarrshn0lqusle9rawxygld2rxqqpqjx5ema";

  // User address on Aleo
  const aleoUser =
    "aleo1xn95qawwq4wj7ww5laqtxzntuwqfg6qc7jz3rawecd5fsctz6uyqmsqrvs";

  const aleoChainId = 101;
  const ethChainId = 1;

  // test("Deploy", async() => {
  //   await bridge.deploy()
  // }, 30_000)

  test("Transfer Token From Aleo To Ethereum", async () => {

    const tokenOrigin: TokenOrigin = {
      chain_id: ethChainId,
      token_service_address: evm2AleoArr(ethTsContract),
      token_address: evm2AleoArr(USDC)
    }

    await tokenService.token_send(
      wUSDC,
      evm2AleoArr(ethUser),
      BigInt(100),
      tokenOrigin
    )
  });

  test("Receive Token From Ethereum To Aleo", async () => {

    let source: TokenOrigin = {
      chain_id: ethChainId,
      token_service_address: evm2AleoArr(ethTsContract),
      token_address: evm2AleoArr(USDC)
    }

    await tokenService.token_receive(
      source,
      wUSDC,
      evm2AleoArr(ethUser),
      aleoUser,
      BigInt(100),
      1,
      1
    )
  });


  

});
