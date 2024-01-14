import { Token_bridgeContract } from "../artifacts/js/token_bridge";
import { InPacketFull } from "../artifacts/js/types";
import {
  aleoChainId,
  aleoTsContract,
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
  ethChainId,
  ethTsContract,
  ethUser,
  usdcContractAddr,
  wusdcTokenAddr,
} from "./mockData";

import { evm2AleoArr } from "./utils";

describe("Token Bridge ", () => {
  const bridge = new Token_bridgeContract({mode: "execute"});
  describe("Initialize", () => {
    const normalThreshold = 1; // Any range between 1 and 5
    const lowThreshold = 0; // Any number <= 0
    const highThreshold = 6; // Any number above 5
    const admin = aleoUser1;

    // test("Deploy", async () => {
    //   const deployTx = await bridge.deploy();
    //   await deployTx.wait();
    // }, 100_000);

    test.failing(
      "Initialize - Threshold too low (must fail)",
      async () => {
        await bridge.initialize_tb(
          lowThreshold,
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          admin // governance
        );
      },
      100_000
    );

    test.failing(
      "Initialize - Threshold too low (must fail)",
      async () => {
        await bridge.initialize_tb(
          lowThreshold,
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          admin // governance
        );
      },
      100_000
    );

    test.failing(
      "Initialize - Threshold too high (must fail)",
      async () => {
        await bridge.initialize_tb(
          highThreshold,
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          admin // governance
        );
      },
      100_000
    );

    test.failing(
      "Initialize - Repeated attestors (must fail)",
      async () => {
        await bridge.initialize_tb(
          highThreshold,
          [aleoUser1, aleoUser2, aleoUser3, aleoUser3, aleoUser5],
          admin // governance
        );
      },
      100_000
    );

    test.skip("Initialize (First try) - Expected parameters (must pass)", async () => {
      // TODO: figure out why unskipping this fails consume below
      let isBridgeInitialized = true;
      try {
        const threshold = bridge.attestor_settings(true);
      } catch (err) {
        isBridgeInitialized = false;
      }

      if (!isBridgeInitialized) {
        const initializeTx = await bridge.initialize_tb(
          normalThreshold,
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          admin // governance
        );
        // @ts-ignore
        await initializeTx.wait();
      }
    }, 100_000);

    test.skip(// TODO: this must fail - only throws error but the actual task passes
    "Initialize (Second try) - Expected parameters (must fail)", async () => {
      let isBridgeInitialized = true;
      try {
        const threshold = bridge.attestor_settings(true);
      } catch (err) {
        isBridgeInitialized = false;
      }

      if (isBridgeInitialized) {
        const initializeTx = await bridge.initialize_tb(
          normalThreshold,
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          admin // governance
        );
        // @ts-ignore
        await initializeTx.wait();
      }
    }, 100_000);

  });

  describe("Attest", () => {

    test.todo("Attestation can only be done on chain the packet is addressed to")
    test.todo("Attestation can only be done on packets coming from support chain")
    test.todo("Attestation can only be done by valid attestors ")
    test.todo("Attestation can only be done once per attestor")
    test.todo("Attestation should increase the attestation count by 1")
    test.todo("If attestation crosses the threshold, packet should be queryable by packetId")

  })

  describe("Consume", () => {
    test.failing("Consume can only be called from program", async () => {
      await bridge.consume(
        ethChainId, // sourceChainId
        evm2AleoArr(ethTsContract), // sourceServiceContract
        wusdcTokenAddr, // token
        evm2AleoArr(ethUser), // sender
        aleoUser1, // receiver
        aleoUser1, // actual_receiver
        BigInt(100), // amount
        1, // sequence
        1 // height
      )

    }, 100_000)

  })

  describe("Publish", () => {

    test.failing("Publish can only be called from program", async () => {
      await bridge.publish(
        ethChainId, // destinationChainId
        evm2AleoArr(ethTsContract), // destinationServiceContract
        evm2AleoArr(usdcContractAddr), // token
        aleoUser1, // sender
        evm2AleoArr(ethUser), // receiver
        BigInt(100) // amount
      );
    })

  })

  describe("Governance", () => {

    test.todo("Add attestor")
    test.todo("Remove attestor")
    test.todo("Update threshold")
    test.todo("Enable Chain")
    test.todo("Disable Chain")
    test.todo("Enable Service")
    test.todo("Disable Service")

  })

});
