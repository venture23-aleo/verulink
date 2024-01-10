import { Token_bridgeContract } from "../artifacts/js/token_bridge";
import { InPacketFull } from "../artifacts/js/types";
import { aleoChainId, aleoTsContract, aleoUser, ethChainId, ethTsContract, ethUser, usdcContractAddr, wUSDCProgramAddr } from "./mockData";

import { evm2AleoArr } from "./utils";

const bridge = new Token_bridgeContract();

describe("Aleo Bridge", () => {
  // test("Deploy", async() => {
  //   await bridge.deploy()
  // }, 30_000)

  test("Attest", async () => {
    let packet: InPacketFull = {
      version: 1,
      sequence: 1,
      source: {
        chain_id: ethChainId,
        addr: evm2AleoArr(ethTsContract),
      },
      destination: {
        chain_id: aleoChainId,
        addr: aleoTsContract,
      },
      message: {
        token: wUSDCProgramAddr,
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
        evm2AleoArr(usdcContractAddr), // token
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
        wUSDCProgramAddr, // token
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
