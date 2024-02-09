import { Token_service_v0002Contract } from "../artifacts/js/token_service_v0002";
import { Token_bridge_v0002Contract } from "../artifacts/js/token_bridge_v0002";
import { Council_v0002Contract } from "../artifacts/js/council_v0002";

import { InPacket, TsTransferOwnership } from "../artifacts/js/types";

import { evm2AleoArr, hashStruct, string2AleoArr } from "../utils/utils";
import {
  TOTAL_PROPOSALS_INDEX,
  aleoUser1,
  aleoUser2,
  ethChainId,
  ethTsContractAddr,
  ethUser,
  minimum_transfer,
  nullError,
  nullError2,
  nullError3,
  outgoing_percentage_in_time,
  usdcContractAddr,
  wusdcConnectorAddr,
  wusdcTokenAddr,
} from "./mockData";

import * as js2leo from "../artifacts/js/js2leo";

const tokenService = new Token_service_v0002Contract({ mode: "execute" });
const bridge = new Token_bridge_v0002Contract({ mode: "execute" });
const council = new Council_v0002Contract({ mode: "execute" });

let tx, errorMsg, proposalId;

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
      const ownerAddr = await tokenService.owner_TS(true);
    } catch (err) {
      isTokenServiceInitialized = false;
    }

    if (!isTokenServiceInitialized) {
      const initializeTx = await tokenService.initialize_ts(aleoUser1);
      // @ts-ignore
      await initializeTx.wait();
    }
  }, 100_000);

  test(
    "Initialize (Second try) - Expected parameters (must fail)",
    async () => {
      // TODO: this must fail - only throws error but the actual task passes
      let isTokenServiceInitialized = true;
      try {
        const ownerAddr = await tokenService.owner_TS(true);
      } catch (err) {
        isTokenServiceInitialized = false;
      }

      if (isTokenServiceInitialized) {
        const initializeTx = await tokenService.initialize_ts(aleoUser1);
        // @ts-ignore
        const txReceipt = await initializeTx.wait();
        expect(txReceipt.error).toBeTruthy();
      }
    },
    100_000
  );

  test.failing("Transfer Token From Aleo To Ethereum", async () => {
    await tokenService.token_send(
      wusdcTokenAddr, // token
      aleoUser1,
      evm2AleoArr(ethUser), // receiver
      BigInt(100), // amount
      ethChainId, // originChainId
      evm2AleoArr(usdcContractAddr), // originTokenAddress
      evm2AleoArr(ethTsContractAddr) // origin token service address
    );
  });

  // test.failing("Receive Token From Ethereum To Aleo", async () => {
  //   await tokenService.token_receive(
  //     ethChainId, //source chain id
  //     evm2AleoArr(ethTsContractAddr), // source token service address
  //     evm2AleoArr(usdcContractAddr), // originTokenAddress
  //     wusdcTokenAddr,
  //     evm2AleoArr(ethUser), // sender
  //     aleoUser1, // receiver
  //     aleoUser1, // actual_receiver
  //     BigInt(100), // amount
  //     BigInt(1), // sequence
  //     1 // height
  //   );
  // });

  describe("Governance Tests", () => {

    test("should support chain", async () => {
      tx = await tokenService.support_chain_ts(
        ethChainId,
        evm2AleoArr(ethTsContractAddr)
      );
      await tx.wait();
      expect(
        await tokenService.token_service_contracts(ethChainId)
      ).toStrictEqual(evm2AleoArr(ethTsContractAddr));
    }, 20000_000);

    test("should remove chain", async () => {
      tx = await tokenService.remove_chain_ts(ethChainId);
      await tx.wait();
      try {
        await tokenService.token_service_contracts(ethChainId);
      } catch (err) {
        errorMsg = err.message;
      }
      expect(errorMsg).toContain(nullError2);
    }, 20000_000);

    test("should support token", async () => {
      tx = await tokenService.support_token_ts(
        wusdcTokenAddr,
        wusdcConnectorAddr,
        minimum_transfer,
        100_00,
        1
      );
      await tx.wait();
      expect(
        await tokenService.max_outgoing_percentage(wusdcTokenAddr)
      ).toStrictEqual(outgoing_percentage_in_time);
      expect(await tokenService.minimum_transfers(wusdcTokenAddr)).toBe(
        minimum_transfer
      );
      expect(await tokenService.token_connectors(wusdcTokenAddr)).toBe(
        wusdcConnectorAddr
      );
    }, 20000_000);

    test("should Update minimum transfer", async () => {
      tx = await tokenService.update_minimum_transfer_ts(
        wusdcTokenAddr,
        BigInt(200)
      );
      await tx.wait();
      expect(await tokenService.minimum_transfers(wusdcTokenAddr)).toBe(
        BigInt(200)
      );
    }, 20000_000);

    test("should Update  outgoing percentage", async () => {
      tx = await tokenService.update_outgoing_percentage_ts(
        wusdcTokenAddr,
        200,
        1
      );
      await tx.wait();
      const new_outgoing_percentage = {
        outgoing_percentage: 200,
        timeframe: 1,
      };
      expect(
        await tokenService.max_outgoing_percentage(wusdcTokenAddr)
      ).toStrictEqual(new_outgoing_percentage);
    }, 20000_000);

    test("should remove token", async () => {
      tx = await tokenService.remove_token_ts(wusdcTokenAddr);
      await tx.wait();
      try {
        await tokenService.token_connectors(wusdcTokenAddr);
      } catch (err) {
        errorMsg = err.message;
      }
      expect(errorMsg).toBe(nullError);
      try {
        await tokenService.max_outgoing_percentage(wusdcTokenAddr);
      } catch (err) {
        errorMsg = err.message;
      }
      expect(errorMsg).toBe(nullError3);
      try {
        await tokenService.minimum_transfers(wusdcTokenAddr);
      } catch (err) {
        errorMsg = err.message;
      }
      expect(errorMsg).toBe(nullError);
    }, 20000_000);

    test("Transfer Ownership", async () => {
      tx = await tokenService.transfer_ownership_ts(
        aleoUser2
      );
      await tx.wait();
      expect(await tokenService.owner_TS(true)).toBe(aleoUser2);
    }, 20000_000);

    test.todo("Update token connector")
  });
});
