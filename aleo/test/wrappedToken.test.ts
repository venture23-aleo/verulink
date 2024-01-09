import { Wrapped_tokenContract } from "../artifacts/js/wrapped_token";

import { evm2AleoArr, string2AleoArr } from "./utils";

const wrappedToken = new Wrapped_tokenContract({ networkName: "testnet3", privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH" });

describe("Wrapped Token", () => {
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

  test("Add Token", async () => {

    const name = "Wrapped USDC";
    const symbol = "wUSDC";
    const decimals = 18;

    await wrappedToken.add_token(
        string2AleoArr(name, 32),
        string2AleoArr(symbol, 16),
        decimals,
        ethChainId,
        evm2AleoArr(USDC)
    );
  });

  

});
