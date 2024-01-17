import { Token_serviceContract } from "../artifacts/js/token_service";
import { InPacketFull } from "../artifacts/js/types";

import { evm2AleoArr, string2AleoArr } from "../utils/utils";
import {
  aleoChainId,
  aleoTsContract,
  aleoUser1,
  ethChainId,
  ethTsContract,
  ethUser,
  usdcContractAddr,
  wusdcConnectorAddr,
  wusdcTokenAddr,
} from "./mockData";
import { Token_bridgeContract } from "../artifacts/js/token_bridge";

const tokenService = new Token_serviceContract({ mode: "execute" });
const bridge = new Token_bridgeContract({mode: "execute"});

describe("Token Service", () => {

    test("Deploy Bridge", async () => {
      const deployTx = await bridge.deploy();
      await deployTx.wait();
    }, 100_000);

  test("Deploy Token Service", async () => {
    const deployTx = await tokenService.deploy();
    await deployTx.wait();
  }, 100_000);

    test("Initialize (First try) - Expected parameters (must pass)", async () => {
      // TODO: figure out why unskipping this fails consume below
      let isTokenServiceInitialized = true;
      try {
        const governanceAddr = tokenService.owner_TS(true);
      } catch (err) {
        isTokenServiceInitialized = false;
      }

      if (!isTokenServiceInitialized) {
        const initializeTx = await tokenService.initialize_ts(aleoUser1);
        // @ts-ignore
        await initializeTx.wait();
      }
    }, 100_000);

    test.failing("Initialize (Second try) - Expected parameters (must fail)", async () => {
      // TODO: this must fail - only throws error but the actual task passes
      let isBridgeInitialized = true;
      try {
        const threshold = bridge.attestor_settings(true);
      } catch (err) {
        isBridgeInitialized = false;
      }

      if (isBridgeInitialized) {
        const initializeTx = await tokenService.initialize_ts(aleoUser1);
        // @ts-ignore
        await initializeTx.wait();
      }
    }, 100_000);

  test.failing("Transfer Token From Aleo To Ethereum", async () => {
    await tokenService.token_send(
      wusdcTokenAddr, // token
      evm2AleoArr(ethUser), // receiver
      BigInt(100), // amount
      ethChainId, // originChainId
      evm2AleoArr(usdcContractAddr), // originTokenAddress
      evm2AleoArr(ethTsContract) // origin token service address
    );
  });

  test.failing("Receive Token From Ethereum To Aleo", async () => {
    await tokenService.token_receive(
      ethChainId, //source chain id
      evm2AleoArr(ethTsContract), // source token service address
      evm2AleoArr(usdcContractAddr), // originTokenAddress
      wusdcTokenAddr,
      evm2AleoArr(ethUser), // sender
      aleoUser1, // receiver
      aleoUser1, // actual_receiver
      BigInt(100), // amount
      1, // sequence
      1 // height
    );
  });

  describe("Governance Tests", async () => {
    test.todo("Update governance")
    test.todo("Support chain")
    test.todo("Remove chain")
    test.todo("Support token")
    test.todo("Update token connector")
    test.todo("Remove token")
    test.todo("Update minimum transfer")
    test.todo("Update outgoing percentage")
  })

});
