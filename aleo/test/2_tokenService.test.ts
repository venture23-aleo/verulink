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
import { BRIDGE_VERSION } from "../utils/constants";
import { createRandomPacket } from "../utils/packet";


const tokenService = new Token_service_v0002Contract({ mode: "execute" });
const bridge = new Token_bridge_v0002Contract({ mode: "execute" });
const council = new Council_v0002Contract({ mode: "execute" });
const wusdcToken = new Wusdc_token_v0002Contract({ mode: "execute" });
const wusdcHolding = new Wusdc_holding_v0002Contract({ mode: "execute" });
const wusdcConnector = new Wusdc_connector_v0002Contract({ mode: "execute" });


const createPacket = (
  receiver: string,
  amount: bigint,
  aleoTsAddr: string
): InPacket => {
  return createRandomPacket(
    receiver,
    amount,
    ethChainId,
    aleoChainId,
    ethTsContractAddr,
    aleoTsAddr,
    wusdcToken.address(),
    ethUser
  );
};


describe("Token Service", () => {
  const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = tokenService.getAccounts();
  const normalThreshold = 2; // Any range between 1 and 5
  const admin = aleoUser1;

  describe('Deploy', () => {
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

  })

  describe('Setup', () => {
    test("Initialize (First try) - Expected parameters (must pass)", async () => {
      const ownerAddr = await tokenService.owner_TS(true, '');
      if (ownerAddr.length === 0) {
        const [initializeTx] = await tokenService.initialize_ts(aleoUser1);
        await tokenService.wait(initializeTx);
        expect(await tokenService.owner_TS(true)).toBe(aleoUser1);
      }

    }, TIMEOUT);

    // TEST: Comment out test if already initialized
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

    test("Owner should unpause bridge", async () => {
      bridge.connect(aleoUser1);
      const [tx1] = await bridge.unpause_tb();
      await bridge.wait(tx1);
      expect(await bridge.bridge_settings(PAUSABILITY_INDEX)).toBe(1);
    }, TIMEOUT)

    test('add chain', async () => {
      const [addChainTx] = await bridge.add_chain_tb(ethChainId);
      await bridge.wait(addChainTx);
      expect(await bridge.supported_chains(ethChainId)).toBe(true);
    }, TIMEOUT)

    test('add service', async () => {
      const [addSupportedServiceTx] = await bridge.add_service_tb(tokenService.address());
      await bridge.wait(addSupportedServiceTx);
      expect(await bridge.supported_services(tokenService.address())).toBe(true);
    }, TIMEOUT)

    test("Owner can update threshold", async () => {
      bridge.connect(aleoUser1);
      const [tx] = await bridge.update_threshold_tb(1);
      await bridge.wait(tx);
      expect(await bridge.bridge_settings(THRESHOLD_INDEX)).toBe(1);
    }, TIMEOUT)

    test("owner should add token", async () => {
      tokenService.connect(aleoUser1);
      console.log(aleoUser1, await tokenService.owner_TS(true))
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

    test('owner should unpause token', async () => {
      const [uppauseTokenStatusTx] = await tokenService.unpause_token_ts(wusdcToken.address());
      await tokenService.wait(uppauseTokenStatusTx);
      expect(await tokenService.token_status(wusdcToken.address())).toBe(false);
    }, TIMEOUT)

    test.skip.failing("Initialize (Second try) - Expected parameters (must fail)", async () => {
      const ownerAddr = await tokenService.owner_TS(true, '');
      if (ownerAddr.length > 0) {
        const [initializeTx] = await tokenService.initialize_ts(aleoUser1);
        await tokenService.wait(initializeTx);
      } else {
        throw new Error("Token Service not initialized");
      }
    },
      TIMEOUT)


  })

  describe.skip('Transfer/Receive', () => {
    test.skip.failing("Transfer Token From Aleo To Ethereum (must fail): Only called from connector program", async () => {
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
    //     BigInt(100), // amount
    //     BigInt(1), // sequence
    //     BigInt(1), // height
    //     signers,
    //     signs
    //   );
    // });
  })

  describe("Governance Tests", () => {

    test.skip.failing("should not add token by non-admin", async () => {
      tokenService.connect(aleoUser3);
      const [tx] = await tokenService.add_token_ts(
        wusdcToken.address(),
        wusdcConnector.address(),
        minimum_transfer,
        maximum_trasnfer,
        100_00,
        1,
        threshold_no_limit
      );
      await tokenService.wait(tx);
    }, TIMEOUT);


    test.skip.failing("should not Update minimum transfer by non-admin", async () => {
      tokenService.connect(aleoUser3);
      const [tx] = await tokenService.update_min_transfer_ts(
        wusdcToken.address(),
        BigInt(200)
      );
      await tokenService.wait(tx);

    }, TIMEOUT);

    test.skip("should Update minimum transfer", async () => {
      tokenService.connect(aleoUser1);
      const [tx] = await tokenService.update_min_transfer_ts(
        wusdcToken.address(),
        BigInt(200)
      );
      await tokenService.wait(tx);
      expect(await tokenService.min_transfers(wusdcToken.address())).toBe(
        BigInt(200)
      );
    }, TIMEOUT);

    test.skip.failing("should not Update maximum transfer by non-admin", async () => {
      tokenService.connect(aleoUser3);
      const [tx] = await tokenService.update_max_transfer_ts(
        wusdcToken.address(),
        BigInt(20000000000)
      );
      await tokenService.wait(tx);
    }, TIMEOUT);

    test.skip("should Update maximum transfer", async () => {
      tokenService.connect(aleoUser1);
      const [tx] = await tokenService.update_max_transfer_ts(
        wusdcToken.address(),
        BigInt(20000000000)
      );
      await tokenService.wait(tx);
      expect(await tokenService.max_transfers(wusdcToken.address())).toBe(
        BigInt(20000000000)
      );
    }, TIMEOUT);

    test.skip.failing("should not Update withdrawl by non-admin", async () => {
      tokenService.connect(aleoUser3);
      const [tx] = await tokenService.update_withdrawal_limit(
        wusdcToken.address(),
        200,
        1,
        BigInt(20000000000)
      );
      await tokenService.wait(tx);
    }, TIMEOUT);

    test.skip("should Update withdrawl", async () => {
      tokenService.connect(aleoUser1);
      const [tx] = await tokenService.update_withdrawal_limit(
        wusdcToken.address(),
        200,
        1,
        BigInt(20000000000)
      );
      await tokenService.wait(tx);
      const new_outgoing_percentage = {
        percentage: 200,
        duration: 1,
        threshold_no_limit: BigInt(20000000000)
      };
      expect(
        await tokenService.token_withdrawal_limits(wusdcToken.address())
      ).toStrictEqual(new_outgoing_percentage);
    }, TIMEOUT);

    test.skip.failing("should not remove token by non-admin", async () => {
      tokenService.connect(aleoUser3);
      const [tx] = await tokenService.remove_token_ts(wusdcToken.address());
      await tokenService.wait(tx);
    }, TIMEOUT);

    test.skip("should remove token by owner", async () => {
      tokenService.connect(aleoUser1);
      let isTokenAvailable = await tokenService.token_connectors(wusdcToken.address(), '');
      expect(isTokenAvailable).toBe(wusdcConnector.address());
      const [tx] = await tokenService.remove_token_ts(wusdcToken.address());
      await tokenService.wait(tx);

      isTokenAvailable = await tokenService.token_connectors(wusdcToken.address(), '');
      expect(isTokenAvailable).toBe('');

    }, TIMEOUT);

    test.skip.failing("should not Transfer Ownership by non-admin", async () => {
      tokenService.connect(aleoUser3);
      const [tx] = await tokenService.transfer_ownership_ts(
        aleoUser2
      );
      await tokenService.wait(tx);
    }, TIMEOUT);

    test.skip("should Transfer Ownership", async () => {
      tokenService.connect(aleoUser1);
      const [tx] = await tokenService.transfer_ownership_ts(
        aleoUser2
      );
      await tokenService.wait(tx);
      expect(await tokenService.owner_TS(true)).toBe(aleoUser2);
    }, TIMEOUT);


    test.skip.failing("should not Update token connector address by non token connector address", async () => {
      tokenService.connect(aleoUser3);
      const [tx] = await tokenService.update_connector_ts(
        wusdcToken.address(),
        wusdcConnector.address()
      );
      await tokenService.wait(tx);
    })

    // TEST: Remove the assert logic from the code for test
    test.skip("should Update token connector address", async () => {
      tokenService.connect(aleoUser1);
      const [tx] = await tokenService.update_connector_ts(
        wusdcToken.address(),
        wusdcConnector.address()
      );
      await tokenService.wait(tx);
      expect(await tokenService.token_connectors(wusdcToken.address())).toBe(wusdcConnector.address());
    }, TIMEOUT);
  });

  describe("Token Send/Receive", () => {
    test("token receive with screening passed", async () => {
      //add token required for token send, with token connector as aleoUser1
      //Setup for token receive
      // TEST: Comment out test if already initialized
      // const [uppauseTokenStatusTx] = await tokenService.unpause_token_ts(wusdcToken.address());
      // await tokenService.wait(uppauseTokenStatusTx);
      // const [addSupportedServiceTx] = await bridge.add_service_tb(tokenService.address());
      // await bridge.wait(addSupportedServiceTx)
      //Setup complete
      tokenService.connect(aleoUser1);
      const packet = createPacket(aleoUser1, BigInt(1000_000), tokenService.address());
      console.log(packet)
      const signature = signPacket(packet, true, bridge.config.privateKey);
      const signatures = [
        signature,
        signature,
        signature,
        signature,
        signature,
      ];
      const signers = [
        aleoUser1,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
      ];

      const [res, tx] = await tokenService.token_receive(
        packet.source.chain_id,
        packet.source.addr,
        packet.message.dest_token_address,
        packet.message.sender_address,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures
      );
      await tokenService.wait(tx);

      expect(res).toBe(true);
      expect(await tokenService.total_supply(wusdcToken.address())).toBe(BigInt(1000_000))
    }, TIMEOUT)




    // TEST: Remove the assert logic from the transition and finalize for test
    test.skip("token send", async () => {
      tokenService.connect(aleoUser1);
      //add token required for token send, with token connector as aleoUser1
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
        BigInt(100_000),
        ethChainId,
        evm2AleoArr(usdcContractAddr),
        evm2AleoArr(ethTsContractAddr)
      );
      await tokenService.wait(tx);
      expect(await tokenService.total_supply(wusdcToken.address())).toBe(BigInt(900_000))
    }, TIMEOUT)

  })
});
