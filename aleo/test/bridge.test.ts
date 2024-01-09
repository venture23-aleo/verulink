import { Token_bridgeContract } from "../artifacts/js/token_bridge";
import { InPacketFull } from "../artifacts/js/types";

import { evm2AleoArr } from "./utils";

const bridge = new Token_bridgeContract();

describe("Aleo Bridge", () => {
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

  test("Attest", async () => {
    let packet: InPacketFull = {
      version: 1,
      sequence: 1,
      source: {
        chain_id: 1,
        addr: evm2AleoArr(ethTsContract),
      },
      destination: {
        chain_id: 2,
        addr: aleoTsContract,
      },
      message: {
        token: wUSDC,
        sender: evm2AleoArr(ethUser),
        receiver: aleoUser,
        amount: BigInt(100),
      },
      height: 10,
    };
    await bridge.attest(packet, true);
  });

  test("Publish", async () => {
    const expectedErrorMsg =
      "SnarkVM Error: 'token_bridge.aleo/publish' is not satisfied on the given inputs";
    let errorMsg = "";
    try {
      await bridge.publish(
        ethChainId, // destinationChainId
        evm2AleoArr(ethTsContract), // destinationServiceContract
        evm2AleoArr(USDC), // token
        aleoUser, // sender
        evm2AleoArr(ethUser), // receiver
        BigInt(100) // amount
      );
    } catch (err) {
      errorMsg = err.message;
    }
    expect(errorMsg).toContain(expectedErrorMsg);
  });

  test("Consume", async () => {
    const expectedErrorMsg =
      "SnarkVM Error: 'token_bridge.aleo/consume' is not satisfied on the given inputs";
    let errorMsg = "";
    try {
      await bridge.consume(
        ethChainId, // sourceChainId
        evm2AleoArr(ethTsContract), // sourceServiceContract
        wUSDC, // token
        evm2AleoArr(ethUser), // sender
        aleoUser, // receiver
        aleoUser, // actual_receiver
        BigInt(100), // amount
        1,
        1
      );
    } catch (err) {
      errorMsg = err.message;
    }
    expect(errorMsg).toContain(expectedErrorMsg);
  });
});
