import { Token_serviceContract } from "../artifacts/js/token_service";
import { InPacketFull, TsTransferOwnership } from "../artifacts/js/types";
import { CouncilContract } from "../artifacts/js/council";


import { evm2AleoArr, hashStruct, string2AleoArr } from "../utils/utils";
import {
  TOTAL_PROPOSALS_INDEX,
  aleoChainId,
  aleoTsContract,
  aleoUser1,
  ethChainId,
  ethTsContract,
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
import { Token_bridgeContract } from "../artifacts/js/token_bridge";

import * as js2leo from '../artifacts/js/js2leo';
import * as js2leoCommon from '../artifacts/js/js2leo/common';
import * as leo2jsCommon from '../artifacts/js/leo2js/common';

import { hash } from "aleo-hasher";

const tokenService = new Token_serviceContract({ mode: "execute" });
const bridge = new Token_bridgeContract({mode: "execute"});
const council = new CouncilContract({mode: "execute"});

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

  describe("Governance Tests", () => {
    test("update governance", async() =>
     {
      proposalId = parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
      const TsTransferOwnership : TsTransferOwnership = {
        id : proposalId,
        new_owner : aleoUser1
      }
      const TsTransferOwnershipHash = hashStruct(js2leo.getTsTransferOwnershipLeo(TsTransferOwnership));
      tx = await council.propose(proposalId, TsTransferOwnershipHash);
      await tx.wait();
      tx = await council.ts_update_governance(TsTransferOwnership.id, TsTransferOwnership.new_owner);
      await tx.wait();
      expect(await tokenService.owner_TS(true)).toBe(aleoUser1);
    }, 20000_000);
    test("should support chain", async() => {
      tx= await tokenService.support_chain_ts(ethChainId, evm2AleoArr(ethTsContract));
      await tx.wait();
      expect(await tokenService.token_service_contracts(ethChainId)).toStrictEqual(evm2AleoArr(ethTsContract));
    }, 20000_000);

    test("should remove chain", async() => {
      tx= await tokenService.remove_chain_ts(ethChainId);
      await tx.wait();
            try{
                await tokenService.token_service_contracts(ethChainId);
            }catch(err){
                errorMsg = err.message;
            }
            expect(errorMsg).toContain(nullError2); 
      }, 20000_000);
    
      test("should support token", async() => {
        tx= await tokenService.support_token_ts(wusdcTokenAddr, wusdcConnectorAddr, minimum_transfer, 100_00, 1);
        await tx.wait();
        expect(await tokenService.max_outgoing_percentage(wusdcTokenAddr)).toStrictEqual(outgoing_percentage_in_time);
        expect(await tokenService.minimum_transfers(wusdcTokenAddr)).toBe(minimum_transfer);
        expect(await tokenService.token_connectors(wusdcTokenAddr)).toBe(wusdcConnectorAddr);
      }, 20000_000);

      test("should Update minimum transfer", async() => {
        tx= await tokenService.update_minimum_transfer_ts(wusdcTokenAddr, BigInt(200));
        await tx.wait();
        expect(await tokenService.minimum_transfers(wusdcTokenAddr)).toBe(BigInt(200));
      }, 20000_000);

      test("should Update  outgoing percentage", async() => {
        tx= await tokenService.update_outgoing_percentage_ts(wusdcTokenAddr, 200, 1);
        await tx.wait();
        const new_outgoing_percentage = {"outgoing_percentage": 200, "timeframe": 1}
        expect(await tokenService.max_outgoing_percentage(wusdcTokenAddr)).toStrictEqual(new_outgoing_percentage);
      }, 20000_000);

      test("should remove token", async() => {
        tx = await tokenService.remove_token_ts(wusdcTokenAddr);
        await tx.wait();
          try{
                await tokenService.token_connectors(wusdcTokenAddr);
            }catch(err){
                errorMsg = err.message;
            }
            expect(errorMsg).toBe(nullError);
            try{
                await tokenService.max_outgoing_percentage(wusdcTokenAddr);
            }catch(err){
              errorMsg = err.message;
            }
            expect(errorMsg).toBe(nullError3);
            try{
                await tokenService.minimum_transfers(wusdcTokenAddr);
            }catch(err){
              errorMsg = err.message;
            }
            expect(errorMsg).toBe(nullError);
      }, 20000_000);

    // test.todo("Update token connector")
  });

// });
