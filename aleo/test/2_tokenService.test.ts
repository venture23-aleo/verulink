import { Token_service_v0002Contract } from "../artifacts/js/token_service_v0002";
import { Token_bridge_v0002Contract } from "../artifacts/js/token_bridge_v0002";
import { Council_v0002Contract } from "../artifacts/js/council_v0002";
import { Wusdc_token_v0002Contract } from "../artifacts/js/wusdc_token_v0002"
import { Wusdc_holding_v0002Contract } from "../artifacts/js/wusdc_holding_v0002";
import { Wusdc_connector_v0002Contract } from "../artifacts/js/wusdc_connector_v0002";

import { evm2AleoArr } from "../utils/ethAddress";
import {
  TIMEOUT,
  THRESHOLD_INDEX,
  TOTAL_ATTESTORS_INDEX,
  TOTAL_PROPOSALS_INDEX,
  ethChainId,
  ethTsContractAddr,
  ethUser,
  maximum_trasnfer,
  minimum_transfer,
  nullError,
  nullError2,
  nullError3,
  aleoUser5,
  outgoing_percentage_in_time,
  threshold_no_limit,
  usdcContractAddr,
  PAUSABILITY_INDEX,
  ALEO_ZERO_ADDRESS,
  aleoChainId,
} from "./mockData";
import { InPacket, PacketId } from "../artifacts/js/types/token_bridge_v0002";
import { signPacket } from "../utils/sign";


const tokenService = new Token_service_v0002Contract({ mode: "execute" });
const bridge = new Token_bridge_v0002Contract({ mode: "execute" });
const council = new Council_v0002Contract({ mode: "execute" });
const wusdcToken = new Wusdc_token_v0002Contract({ mode: "execute" });
const wusdcHolding = new Wusdc_holding_v0002Contract({ mode: "execute" });
const wusdcConnector = new Wusdc_connector_v0002Contract({ mode: "execute" });


describe("Token Service", () => {
  const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = tokenService.getAccounts();
  const normalThreshold = 2; // Any range between 1 and 5
  const admin = aleoUser1;

  describe('Setup', () => {
    test("Deploy Bridge", async () => {
      bridge.connect(aleoUser1);
      const deployTx = await bridge.deploy();
      await bridge.wait(deployTx);
    }, TIMEOUT);

    test("Deploy Token Service", async () => {
      tokenService.connect(aleoUser1);
      const deployTx = await tokenService.deploy();
      await tokenService.wait(deployTx);
    }, TIMEOUT);

    test("Initialize (First try) - Expected parameters (must pass)", async () => {
      const ownerAddr = await tokenService.owner_TS(true, '');
      if (ownerAddr.length === 0) {
        const [initializeTx] = await tokenService.initialize_ts(aleoUser1);
        await tokenService.wait(initializeTx);
        expect(await tokenService.owner_TS(true)).toBe(aleoUser1);
      }

    }, TIMEOUT);


    // // TEST: Comment out test if already initialized
    test("Initialize Bridge - Expected parameters (must pass)", async () => {
      const [tx] = await bridge.initialize_tb(
        [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
        normalThreshold,
        admin //governance
      );

      await bridge.wait(tx);
      expect(await bridge.bridge_settings(THRESHOLD_INDEX)).toBe(normalThreshold);
      expect(await bridge.bridge_settings(TOTAL_ATTESTORS_INDEX)).toBe(5);
      expect(await bridge.attestors(aleoUser1)).toBeTruthy();
      expect(await bridge.attestors(aleoUser2)).toBeTruthy();
      expect(await bridge.attestors(aleoUser3)).toBeTruthy();
      expect(await bridge.attestors(aleoUser4)).toBeTruthy();
      expect(await bridge.attestors(aleoUser5)).toBeTruthy();
    }, TIMEOUT);

    test("Owner should unpause", async () => {
      bridge.connect(aleoUser1);
      const [tx1] = await bridge.unpause_tb();
      await bridge.wait(tx1);
      expect(await bridge.bridge_settings(PAUSABILITY_INDEX)).toBe(1);
    }, TIMEOUT)

    // test.failing("Initialize (Second try) - Expected parameters (must fail)", async () => {
    //   const ownerAddr = await tokenService.owner_TS(true, '');
    //   if (ownerAddr.length > 0) {
    //     const [initializeTx] = await tokenService.initialize_ts(aleoUser1);
    //     await tokenService.wait(initializeTx);
    //   } else {
    //     throw new Error("Token Service not initialized");
    //   }
    // },
    //   TIMEOUT)
  })

  // describe('Transfer/Receive', () => {
  //   test.failing("Transfer Token From Aleo To Ethereum (must fail): Only called from connector program", async () => {
  //     await tokenService.token_send(
  //       wusdcToken.address(), // token
  //       aleoUser1,
  //       evm2AleoArr(ethUser), // receiver
  //       BigInt(100), // amount
  //       ethChainId, // originChainId
  //       evm2AleoArr(usdcContractAddr), // originTokenAddress
  //       evm2AleoArr(ethTsContractAddr) // origin token service address
  //     );
  //   });

  //   // test.failing("Receive Token From Ethereum To Aleo", async () => {
  //   //   await tokenService.token_receive(
  //   //     ethChainId, //source chain id
  //   //     evm2AleoArr(ethTsContractAddr), // source token service address
  //   //     evm2AleoArr(usdcContractAddr), // originTokenAddress
  //   //     wusdcTokenAddr,
  //   //     evm2AleoArr(ethUser), // sender
  //   //     aleoUser1, // receiver
  //   //     BigInt(100), // amount
  //   //     BigInt(1), // sequence
  //   //     BigInt(1), // height
  //   //     signers,
  //   //     signs
  //   //   );
  //   // });
  // })



  describe("Governance Tests", () => {

    //   test.failing("should not add token by non-admin", async () => {
    //     tokenService.connect(aleoUser3);
    //     const [tx] = await tokenService.add_token_ts(
    //       wusdcToken.address(),
    //       wusdcConnector.address(),
    //       minimum_transfer,
    //       maximum_trasnfer,
    //       100_00,
    //       1,
    //       threshold_no_limit
    //     );
    //     await tokenService.wait(tx);
    //   }, TIMEOUT);

    test("should add token", async () => {
      tokenService.connect(aleoUser1);
      const [tx] = await tokenService.add_token_ts(
        wusdcToken.address(),
        aleoUser1,//for further testing set to aleouser1 instead of wusdcconnector.address()
        minimum_transfer,
        maximum_trasnfer,
        100_00,
        1,
        threshold_no_limit
      );
      await tokenService.wait(tx);
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
        aleoUser1
      );
    }, TIMEOUT);

    // test.failing("should not Update minimum transfer by non-admin", async () => {
    //   tokenService.connect(aleoUser3);
    //   const [tx] = await tokenService.update_min_transfer_ts(
    //     wusdcToken.address(),
    //     BigInt(200)
    //   );
    //   await tokenService.wait(tx);

    // }, TIMEOUT);

    //   test("should Update minimum transfer", async () => {
    //     tokenService.connect(aleoUser1);
    //     const [tx] = await tokenService.update_min_transfer_ts(
    //       wusdcToken.address(),
    //       BigInt(200)
    //     );
    //     await tokenService.wait(tx);
    //     expect(await tokenService.min_transfers(wusdcToken.address())).toBe(
    //       BigInt(200)
    //     );
    //   }, TIMEOUT);

    //   test.failing("should not Update maximum transfer by non-admin", async () => {
    //     tokenService.connect(aleoUser3);
    //     const [tx] = await tokenService.update_max_transfer_ts(
    //       wusdcToken.address(),
    //       BigInt(20000000000)
    //     );
    //     await tokenService.wait(tx);
    //   }, TIMEOUT);

    //   test("should Update maximum transfer", async () => {
    //     tokenService.connect(aleoUser1);
    //     const [tx] = await tokenService.update_max_transfer_ts(
    //       wusdcToken.address(),
    //       BigInt(20000000000)
    //     );
    //     await tokenService.wait(tx);
    //     expect(await tokenService.max_transfers(wusdcToken.address())).toBe(
    //       BigInt(20000000000)
    //     );
    //   }, TIMEOUT);

    //   test.failing("should not Update withdrawl by non-admin", async () => {
    //     tokenService.connect(aleoUser3);
    //     const [tx] = await tokenService.update_withdrawal_limit(
    //       wusdcToken.address(),
    //       200,
    //       1,
    //       BigInt(20000000000)
    //     );
    //     await tokenService.wait(tx);
    //   }, TIMEOUT);

    //   test("should Update withdrawl", async () => {
    //     tokenService.connect(aleoUser1);
    //     const [tx] = await tokenService.update_withdrawal_limit(
    //       wusdcToken.address(),
    //       200,
    //       1,
    //       BigInt(20000000000)
    //     );
    //     await tokenService.wait(tx);
    //     const new_outgoing_percentage = {
    //       percentage: 200,
    //       duration: 1,
    //       threshold_no_limit: BigInt(20000000000)
    //     };
    //     expect(
    //       await tokenService.token_withdrawal_limits(wusdcToken.address())
    //     ).toStrictEqual(new_outgoing_percentage);
    //   }, TIMEOUT);

    //   test.failing("should not remove token by non-admin", async () => {
    //     tokenService.connect(aleoUser3);
    //     const [tx] = await tokenService.remove_token_ts(wusdcToken.address());
    //     await tokenService.wait(tx);
    //   }, TIMEOUT);

    //   test("should remove token by owner", async () => {
    //     tokenService.connect(aleoUser1);
    //     let isTokenAvailable = await tokenService.token_connectors(wusdcToken.address(), '');
    //     expect(isTokenAvailable).toBe(wusdcConnector.address());
    //     const [tx] = await tokenService.remove_token_ts(wusdcToken.address());
    //     await tokenService.wait(tx);

    //     isTokenAvailable = await tokenService.token_connectors(wusdcToken.address(), '');
    //     expect(isTokenAvailable).toBe('');

    //   }, TIMEOUT);

    //   test.failing("should not Transfer Ownership by non-admin", async () => {
    //     tokenService.connect(aleoUser3);
    //     const [tx] = await tokenService.transfer_ownership_ts(
    //       aleoUser2
    //     );
    //     await tokenService.wait(tx);
    //   }, TIMEOUT);

    //   test("should Transfer Ownership", async () => {
    //     tokenService.connect(aleoUser1);
    //     const [tx] = await tokenService.transfer_ownership_ts(
    //       aleoUser2
    //     );
    //     await tokenService.wait(tx);
    //     expect(await tokenService.owner_TS(true)).toBe(aleoUser2);
    //   }, TIMEOUT);

    //   test.todo("Update token connector")

    //   test.failing("should not Update token connector address by non token connector address", async () => {
    //     tokenService.connect(aleoUser3);
    //     const [tx] = await tokenService.update_connector_ts(
    //       wusdcToken.address(),
    //       wusdcConnector.address()
    //     );
    //     await tokenService.wait(tx);
    //   })

    //   // TEST: Remove the assert logic from the code for test
    //   test("should Update token connector address", async () => {
    //     tokenService.connect(aleoUser1);
    //     const [tx] = await tokenService.update_connector_ts(
    //       wusdcToken.address(),
    //       wusdcConnector.address()
    //     );
    //     await tokenService.wait(tx);
    //     expect(await tokenService.token_connectors(wusdcToken.address())).toBe(wusdcConnector.address());
    //   }, TIMEOUT);
  });

  describe("Token Send/Receive", () => {
    const incomingSequence = BigInt(
      Math.round(Math.random() * Number.MAX_SAFE_INTEGER)
    );
    const packet: InPacket = {
      version: 0,
      source: {
        chain_id: ethChainId,
        addr: evm2AleoArr(ethTsContractAddr),
      },
      destination: {
        chain_id: aleoChainId,
        addr: tokenService.address(),
      },
      message: {
        dest_token_address: wusdcToken.address(),
        sender_address: evm2AleoArr(ethUser),
        receiver_address: aleoUser1,
        amount: BigInt(10000)
      },
      height: BigInt(10),
      sequence: incomingSequence
    };

    const signature = signPacket(packet, true, bridge.config.privateKey);
    const signatures = [
      signature,
      signature,
      signature,
      signature,
      signature
    ]

    const signers = [
      aleoUser1,
      ALEO_ZERO_ADDRESS,
      ALEO_ZERO_ADDRESS,
      ALEO_ZERO_ADDRESS,
      ALEO_ZERO_ADDRESS,
    ]

    test("token receive", async () => {
      tokenService.connect(aleoUser1);
      //add token required for token send, with token connector as aleoUser1
      //Setup for token receive
      // TEST: Comment out test if already initialized
      const [uppauseTokenStatusTx] = await tokenService.unpause_token_ts(wusdcToken.address());
      await tokenService.wait(uppauseTokenStatusTx);
      const [addChainTx] = await bridge.add_chain_tb(ethChainId);
      await bridge.wait(addChainTx)
      const [addSupportedServiceTx] = await bridge.add_service_tb(tokenService.address());
      await bridge.wait(addSupportedServiceTx)
      //Setup complete

      const [res, tx] = await tokenService.token_receive(
        ethChainId,
        evm2AleoArr(ethTsContractAddr),
        wusdcToken.address(),
        evm2AleoArr(ethUser),
        aleoUser1,
        BigInt(1000),
        BigInt(1),
        BigInt(1),
        signers,
        signatures
      );
      await tokenService.wait(tx);
      expect(await tokenService.total_supply(wusdcToken.address())).toBe(BigInt(1000))
    }, TIMEOUT)


    // TEST: Remove the assert logic from the transition and finalize for test
    test("token send", async () => {
      tokenService.connect(aleoUser1);
      //add token required for token send, with token connector as aleoUser1
      console.log(wusdcToken.address())
      //Setup for token send
      // TEST: Comment out test if already initialized
      // const [uppauseTokenStatusTx] = await tokenService.unpause_token_ts(wusdcToken.address());
      // await tokenService.wait(uppauseTokenStatusTx);
      // const [addChainTx] = await bridge.add_chain_tb(ethChainId);
      // await bridge.wait(addChainTx)
      // const [addSupportedServiceTx] = await bridge.add_service_tb(tokenService.address());
      // await bridge.wait(addSupportedServiceTx)
      //Setup complete

      const [tx] = await tokenService.token_send(
        wusdcToken.address(),
        aleoUser1,
        evm2AleoArr(ethUser),
        BigInt(100),
        ethChainId,
        evm2AleoArr(usdcContractAddr),
        evm2AleoArr(ethTsContractAddr)
      );
      await tokenService.wait(tx);
      expect(await tokenService.total_supply(wusdcToken.address())).toBe(BigInt(900))
    }, TIMEOUT)

  })
});
