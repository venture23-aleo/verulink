import { Token_service_v0002Contract } from "../artifacts/js/token_service_v0002";
import { Token_bridge_v0002Contract } from "../artifacts/js/token_bridge_v0002";
import { Council_v0002Contract } from "../artifacts/js/council_v0002";
import { Wusdc_token_v0002Contract } from "../artifacts/js/wusdc_token_v0002"
import { Wusdc_holding_v0002Contract } from "../artifacts/js/wusdc_holding_v0002";
import { Wusdc_connector_v0002Contract } from "../artifacts/js/wusdc_connector_v0002";


import { evm2AleoArr } from "../utils/ethAddress";
import {
  TIMEOUT,
  TOTAL_PROPOSALS_INDEX,
  ethChainId,
  ethTsContractAddr,
  ethUser,
  maximum_trasnfer,
  minimum_transfer,
  nullError,
  nullError2,
  nullError3,
  outgoing_percentage_in_time,
  threshold_no_limit,
  usdcContractAddr,
} from "./mockData";


const tokenService = new Token_service_v0002Contract({ mode: "execute" });
const bridge = new Token_bridge_v0002Contract({ mode: "execute" });
const council = new Council_v0002Contract({ mode: "execute" });
const wusdcToken = new Wusdc_token_v0002Contract({ mode: "execute" });
const wusdcHolding = new Wusdc_holding_v0002Contract({ mode: "execute" });
const wusdcConnector = new Wusdc_connector_v0002Contract({ mode: "execute" });


const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = tokenService.getAccounts();




let tx, errorMsg, proposalId;

describe("Token Service", () => {
  describe('Setup', () => {
    test("Deploy Bridge", async () => {
      const deployTx = await bridge.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Deploy Token Service", async () => {
      const deployTx = await tokenService.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Initialize (First try) - Expected parameters (must pass)", async () => {
      const ownerAddr = await tokenService.owner_TS(true, '');
      if (ownerAddr.length === 0) {
        const [initializeTx] = await tokenService.initialize_ts(aleoUser1);
        await tokenService.wait(initializeTx);
        expect(await tokenService.owner_TS(true)).toBe(aleoUser1);
      }
    }, TIMEOUT);

    test.failing("Initialize (Second try) - Expected parameters (must fail)", async () => {
      const ownerAddr = await tokenService.owner_TS(true, '');
      if (ownerAddr.length > 0) {
        const [initializeTx] = await tokenService.initialize_ts(aleoUser1);
        await tokenService.wait(initializeTx);
      }
    },
      TIMEOUT
    );
  })

  test.failing("Transfer Token From Aleo To Ethereum", async () => {
    await tokenService.token_send(
      wusdcToken.address(), // token
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

    test("should not add token by non-admin", async () => {
      tokenService.connect(aleoUser3);
      tx = await tokenService.add_token_ts(
        wusdcToken.address(),
        wusdcConnector.address(),
        minimum_transfer,
        maximum_trasnfer,
        100_00,
        1,
        threshold_no_limit
      );
      const receipt = await tx.wait();
      expect(receipt.error).toBeTruthy();
    }, TIMEOUT);

    test("should add token", async () => {
      tokenService.connect(aleoUser1);
      tx = await tokenService.add_token_ts(
        wusdcToken.address(),
        wusdcConnector.address(),
        minimum_transfer,
        maximum_trasnfer,
        100_00,
        1,
        threshold_no_limit
      );
      await tx.wait();
      expect(
        await tokenService.token_withdrawal_limits(wusdcToken.address())
      ).toStrictEqual(outgoing_percentage_in_time);
      expect(await tokenService.min_transfers(wusdcToken.address())).toBe(
        minimum_transfer
      );
      expect(await tokenService.max_transfers(wusdcToken.address())).toBe(
        maximum_trasnfer
      );
      expect(await tokenService.token_connectors(wusdcToken.address())).toBe(
        wusdcConnector.address()
      );
    }, TIMEOUT);

    test("should not Update minimum transfer by non-admin", async () => {
      tokenService.connect(aleoUser3);
      tx = await tokenService.update_min_transfer_ts(
        wusdcToken.address(),
        BigInt(200)
      );
      const receipt = await tx.wait();
      expect(receipt.error).toBeTruthy();
    }, TIMEOUT);

    test("should Update minimum transfer", async () => {
      tokenService.connect(aleoUser1);
      tx = await tokenService.update_min_transfer_ts(
        wusdcToken.address(),
        BigInt(200)
      );
      await tx.wait();
      expect(await tokenService.min_transfers(wusdcToken.address())).toBe(
        BigInt(200)
      );
    }, TIMEOUT);

    test("should not Update maximum transfer by non-admin", async () => {
      tokenService.connect(aleoUser3);
      tx = await tokenService.update_max_transfer_ts(
        wusdcToken.address(),
        BigInt(20000000000)
      );
      const receipt = await tx.wait();
      expect(receipt.error).toBeTruthy();
    }, TIMEOUT);

    test("should Update maximum transfer", async () => {
      tokenService.connect(aleoUser1);
      tx = await tokenService.update_max_transfer_ts(
        wusdcToken.address(),
        BigInt(20000000000)
      );
      await tx.wait();
      expect(await tokenService.max_transfers(wusdcToken.address())).toBe(
        BigInt(20000000000)
      );
    }, TIMEOUT);

    test("should not Update withdrawl by non-admin", async () => {
      tokenService.connect(aleoUser3);
      tx = await tokenService.update_withdrawal_limit(
        wusdcToken.address(),
        200,
        1,
        BigInt(20000000000)
      );
      const receipt = await tx.wait();
      expect(receipt.error).toBeTruthy();
    }, TIMEOUT);

    test("should Update withdrawl", async () => {
      tokenService.connect(aleoUser1);
      tx = await tokenService.update_withdrawal_limit(
        wusdcToken.address(),
        200,
        1,
        BigInt(20000000000)
      );
      await tx.wait();
      const new_outgoing_percentage = {
        percentage: 200,
        duration: 1,
        threshold_no_limit: BigInt(20000000000)
      };
      expect(
        await tokenService.token_withdrawal_limits(wusdcToken.address())
      ).toStrictEqual(new_outgoing_percentage);
    }, TIMEOUT);

    test("should not remove token by non-admin", async () => {
      tokenService.connect(aleoUser3);
      tx = await tokenService.remove_token_ts(wusdcToken.address());
      const receipt = await tx.wait();
      expect(receipt.error).toBeTruthy();
    }, TIMEOUT);

    test("should remove token", async () => {
      tokenService.connect(aleoUser1);
      tx = await tokenService.remove_token_ts(wusdcToken.address());
      await tx.wait();
      try {
        await tokenService.token_connectors(wusdcToken.address());
      } catch (err) {
        errorMsg = false;
      }
      expect(errorMsg).toBe(false);
      try {
        await tokenService.token_withdrawal_limits(wusdcToken.address());
      } catch (err) {
        errorMsg = false;
      }
      expect(errorMsg).toBe(false);
      try {
        await tokenService.min_transfers(wusdcToken.address());
      } catch (err) {
        errorMsg = false;
      }
      expect(errorMsg).toBe(false);
    }, TIMEOUT);

    test("should not Transfer Ownership by non-admin", async () => {
      tokenService.connect(aleoUser3);
      tx = await tokenService.transfer_ownership_ts(
        aleoUser2
      );
      const receipt = await tx.wait();
      expect(receipt.error).toBeTruthy();
    }, TIMEOUT);

    test("should Transfer Ownership", async () => {
      tokenService.connect(aleoUser1);
      tx = await tokenService.transfer_ownership_ts(
        aleoUser2
      );
      await tx.wait();
      expect(await tokenService.owner_TS(true)).toBe(aleoUser2);
    }, TIMEOUT);

    test.todo("Update token connector")
    test.todo("token send")
    test.todo("token receive")
  });
});
