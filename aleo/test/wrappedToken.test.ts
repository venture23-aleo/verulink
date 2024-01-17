import { Wrapped_tokensContract } from "../artifacts/js/wrapped_tokens";
import { ethChainId, usdcContractAddr } from "./mockData";

import { evm2AleoArr, string2AleoArr } from "../utils/utils";

const wrappedToken = new Wrapped_tokensContract();

describe("Wrapped Token", () => {
  // test("Deploy", async() => {
  //   await bridge.deploy()
  // }, 30_000)

  test("Add Token", async () => {

    const name = "Wrapped USDC";
    const symbol = "wUSDC";
    const decimals = 18;

    await wrappedToken.add_token_wt(
        string2AleoArr(name, 32),
        string2AleoArr(symbol, 16),
        decimals,
        ethChainId,
        evm2AleoArr(usdcContractAddr)
    );
  });

  

});
